import {ClientOnly} from '@tanstack/react-router';
import type {AppRouter} from '../../../api/src/trpc/routers/_app';
import {DeltaRenderer} from './delta-renderer';
import {format, isAfter, isSameYear, isToday, isYesterday} from 'date-fns';
import {Tooltip} from './tooltip';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {Thumbnile} from './thumbnile';
import {Toolbar} from './toolbar';
import {cn} from '@/lib/utils';
import {BaseEditor} from './base-editor';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useTRPC} from '@/lib/trpc';
import {useMutation} from '@tanstack/react-query';
import {useConfirm} from '@/hooks/use-confirm';
import {toast} from 'sonner';
import {Reactions} from './reactions';
import {usePanel} from '@/hooks/use-panel';
import {ReplyBar} from './reply-bar';
import pluralize from 'pluralize';

type Props = {
  id: string;
  memberId: string;
  authorImage?: string | null;
  authorName: string;
  isCreator: boolean;
  body: string;
  file?: Awaited<
    ReturnType<AppRouter['messages']['list']>
  >['items'][number]['file'];
  reactions:
    | Awaited<
        ReturnType<AppRouter['messages']['list']>
      >['items'][number]['reactions']
    | null;
  replyCount: number;
  replyUsersCount?: number;
  replyUsers?: string[];
  latestReplyAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isCompact?: boolean;
  isEditing?: boolean;
  onEditingIdChange?: (id: string | null) => void;
  withThreadButton?: boolean;
};

export function Message({
  id,
  isCreator,
  isEditing,
  onEditingIdChange,
  // memberId,
  reactions,
  replyCount,
  latestReplyAt,
  replyUsersCount,
  replyUsers,
  authorName,
  authorImage,
  body,
  file,
  createdAt,
  updatedAt,
  isCompact = false,
  withThreadButton = true,
}: Props) {
  const [ConfirmationDialog, confirm] = useConfirm({
    title: 'Delete message',
    description:
      'Are you sure you want to delete this message? This cannot be undone.',
  });
  const workspaceId = useWorkspaceId();
  const trpc = useTRPC();
  const {threadId, onOpenChange, onClose} = usePanel();

  const {mutate: deleteMessageMutationSync, isPending: isDeleteMessagePending} =
    useMutation(trpc.messages.delete.mutationOptions());
  const {mutate: toggleReactionMutationSync} = useMutation(
    trpc.reactions.toggle.mutationOptions(),
  );

  async function handleDeleteMessage() {
    const ok = await confirm();
    if (!ok) return;
    deleteMessageMutationSync(
      {messageId: id, workspaceId},
      {
        onSuccess: () => {
          toast.success('Message deleted');
          if (threadId !== null && threadId === id) {
            onClose();
          }
        },
        onError: () => {
          toast.error('Failed to delete message');
        },
      },
    );
  }

  function handleReactionChange(value: string) {
    toggleReactionMutationSync(
      {messageId: id, workspaceId, value},
      {
        onError: () => {
          toast.error('Failed to add reaction...');
        },
      },
    );
  }

  if (isCompact) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative',
          isEditing && 'bg-[#f2c74433] hover:bg-[#f2c74433]',
          isDeleteMessagePending &&
            'bg-destructive/50 transform transition-transform duration-200 origin-bottom scale-y-0',
        )}
      >
        <div className='flex items-start gap-2'>
          <Tooltip
            tooltip={getFullTime(createdAt)}
            position='top'
            align='center'
          >
            <button
              aria-label={getFullTime(createdAt)}
              type='button'
              tabIndex={0}
              className='text-xs text-muted-foreground opacity-0 group-hover:opacity-100 w-10 leading-5.5 hover:underline cursor-pointer touch-manipulation'
            >
              {format(createdAt, 'h:mm')}
            </button>
          </Tooltip>
          {isEditing ? (
            <div className='w-full'>
              <ClientOnly fallback='Editor'>
                <BaseEditor
                  defaultValue={JSON.parse(body || '[]')}
                  confirmationSuffixButtonsProps={{
                    onSaveClick: () => {},
                    onCancelClick: () => {
                      onEditingIdChange?.(null);
                    },
                  }}
                  disabled={false}
                  withEmojiButton
                />
              </ClientOnly>
            </div>
          ) : (
            <div className='flex flex-col w-full'>
              <ClientOnly fallback='Delta Renderer'>
                <DeltaRenderer delta={body} />
              </ClientOnly>
              <Thumbnile uri={file?.url} />
              {isAfter(updatedAt, createdAt) && (
                <span className='text-xs text-muted-foreground'>(edited)</span>
              )}
              <Reactions
                reactions={reactions}
                onReactionChange={handleReactionChange}
              />
              {!replyUsers?.length || !latestReplyAt || !replyUsersCount ? (
                replyCount >= 1 ? (
                  <div>
                    <span className='text-xs text-muted-foreground'>
                      {pluralize('reply', replyCount, true)}
                    </span>
                  </div>
                ) : null
              ) : (
                <ReplyBar
                  replyCount={replyCount}
                  replyUsersCount={replyUsersCount}
                  replyUsers={replyUsers}
                  latestReplyAt={latestReplyAt}
                  onClick={() => onOpenChange(id)}
                />
              )}
            </div>
          )}
        </div>
        {!isEditing && (
          <Toolbar
            isPending={false}
            isCompact={isCompact}
            canEdit={isCreator}
            canDelete={isCreator}
            withThreadButton={withThreadButton}
            onEditClick={() => onEditingIdChange?.(id)}
            onThreadClick={() => onOpenChange(id)}
            onDeleteClick={handleDeleteMessage}
            onReactionChange={handleReactionChange}
          />
        )}
        <ConfirmationDialog />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative',
        isEditing && 'bg-[#f2c74433] hover:bg-[#f2c74433]',
        isDeleteMessagePending &&
          'bg-destructive/50 transform transition-transform duration-200 origin-bottom scale-y-0',
      )}
    >
      <div className='flex items-start gap-2'>
        <button className='shrink-0'>
          <Avatar className='size-10'>
            <AvatarImage src={authorImage ?? undefined} alt={authorName} />
            <AvatarFallback className='text-sm'>
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
        {isEditing ? (
          <div className='size-full'>
            <ClientOnly fallback='Editor'>
              <BaseEditor
                defaultValue={JSON.parse(body || '[]')}
                confirmationSuffixButtonsProps={{
                  onSaveClick: () => {},
                  onCancelClick: () => {
                    onEditingIdChange?.(null);
                  },
                }}
                disabled={false}
                withEmojiButton
              />
            </ClientOnly>
          </div>
        ) : (
          <div className='flex flex-col w-full overflow-hidden'>
            <div className='text-sm'>
              <button className='text-sm font-bold text-primary hover:underline cursor-pointer'>
                {authorName}
              </button>
              <span>&nbsp;&nbsp;</span>
              <Tooltip
                tooltip={getFullTime(createdAt)}
                position='top'
                align='center'
              >
                <button
                  aria-label={getFullTime(createdAt)}
                  className='text-xs text-muted-foreground hover:underline cursor-pointer min-w-10 shrink-0'
                >
                  {format(createdAt, 'h:mm a')}
                </button>
              </Tooltip>
            </div>
            <ClientOnly fallback='Delta Renderer'>
              <DeltaRenderer delta={body} />
            </ClientOnly>
            <Thumbnile uri={file?.url} />
            {isAfter(updatedAt, createdAt) && (
              <span className='text-xs text-muted-foreground'>(edited)</span>
            )}
            <Reactions
              reactions={reactions}
              onReactionChange={handleReactionChange}
            />
            {!replyUsers?.length || !latestReplyAt || !replyUsersCount ? (
              replyCount >= 1 ? (
                <div>
                  <span className='text-xs text-muted-foreground'>
                    {pluralize('reply', replyCount, true)}
                  </span>
                </div>
              ) : null
            ) : (
              <ReplyBar
                replyCount={replyCount}
                replyUsersCount={replyUsersCount}
                replyUsers={replyUsers}
                latestReplyAt={latestReplyAt}
                onClick={() => onOpenChange(id)}
              />
            )}
          </div>
        )}
      </div>
      {!isEditing && (
        <Toolbar
          canEdit={isCreator}
          canDelete={isCreator}
          isPending={false}
          onEditClick={() => onEditingIdChange?.(id)}
          onThreadClick={() => onOpenChange(id)}
          onDeleteClick={handleDeleteMessage}
          onReactionChange={handleReactionChange}
          withThreadButton={withThreadButton}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

function getFullTime(date: Date) {
  const now = new Date();
  if (isToday(date)) return format(date, "'Today at' h:mm:ss a");
  if (isYesterday(date)) return format(date, "'Yesterday at' h:mm:ss a");
  if (isSameYear(date, now)) return format(date, "MMM do, 'at' h:mm:ss a");
  return format(date, "MMM d, yyyy 'at' h:mm:ss a");
}
