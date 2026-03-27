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

type Props = {
  id: string;
  memberId: string;
  authorImage?: string | null;
  authorName: string;
  isCreator: boolean;
  body: string;
  file?: Awaited<ReturnType<AppRouter['messages']['list']>>[number]['file'];
  createdAt: Date;
  updatedAt: Date;
  isCompact?: boolean;
  isEditing?: boolean;
  onEditingIdChange?: (id: string | null) => void;
};

export function Message({
  id,
  isCreator,
  isEditing,
  onEditingIdChange,
  // memberId,
  authorName,
  authorImage,
  body,
  file,
  createdAt,
  updatedAt,
  isCompact = false,
}: Props) {
  if (isCompact) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative',
          isEditing && 'bg-[#f2c74433] hover:bg-[#f2c74433]',
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
            </div>
          )}
        </div>
        {!isEditing && (
          <Toolbar
            isPending={false}
            isCompact={isCompact}
            canEdit={isCreator}
            canDelete={isCreator}
            onEditClick={() => onEditingIdChange?.(id)}
            onThreadClick={() => {}}
            onDeleteClick={() => {}}
            onReactionChange={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 group relative',
        isEditing && 'bg-[#f2c74433] hover:bg-[#f2c74433]',
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
          </div>
        )}
      </div>
      {!isEditing && (
        <Toolbar
          canEdit={isCreator}
          canDelete={isCreator}
          isPending={false}
          onEditClick={() => onEditingIdChange?.(id)}
          onThreadClick={() => {}}
          onDeleteClick={() => {}}
          onReactionChange={() => {}}
        />
      )}
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
