import {AlertCircleIcon, LoaderIcon, XIcon} from 'lucide-react';
import {Button} from './ui/button';
import {Tooltip} from './tooltip';
import {useGetMessageQuery} from '@/features/messages/hooks/use-get-message-query';
import {Message} from './message';
import {useCurrentMembershipQuery} from '@/features/memberships/hooks/use-current-membership-query';
import {useState} from 'react';
import {ClientOnly} from '@tanstack/react-router';
import {BaseEditor} from './base-editor';
import {usePaginatedMessagesQuery} from '@/features/channels/hooks/use-paginated-messages-query';
import {useCreateMessageMutation} from '@/features/messages/hooks/use-create-message-mutation';
import {useChannelId} from '@/features/channels/hooks/use-channel-id';
import {format, isSameDay} from 'date-fns';
import {getDateGroupLabel} from '@/utils/get-date-group-label';

type ThreadProps = {
  threadId: string;
  onClose(): void;
  workspaceId: string;
};

export function Thread({onClose, threadId, workspaceId}: ThreadProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const channelId = useChannelId();

  const {data: message, isLoading: messageLoading} = useGetMessageQuery({
    messageId: threadId,
    workspaceId,
  });
  const {data: currentMember} = useCurrentMembershipQuery({workspaceId});
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedMessagesQuery({
    channelId,
    workspaceId,
    parentMessageId: threadId,
  });

  const messages = infiniteData?.pages.flatMap(page => page.items) ?? [];

  const groupedMessages = messages.reduce(
    (groups, message) => {
      const data = new Date(message.createdAt);
      const dateKey = format(data, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof messages>,
  );

  if (messageLoading || isLoading) {
    return (
      <div className='h-full flex-col flex'>
        <div className='flex justify-between items-center px-4 py-2 h-12.25 border-b'>
          <p className='text-lg font-bold px-2 overflow-hidden truncate'>
            Thread
          </p>
          <Tooltip tooltip='Close' position='bottom'>
            <Button
              size='icon-sm'
              variant='ghost'
              type='button'
              onClick={onClose}
              className='text-lg font-bold px-2 overflow-hidden'
              aria-label='Close'
            >
              <XIcon aria-hidden='true' size={20} strokeWidth='1.5' />
            </Button>
          </Tooltip>
        </div>
        <div className='flex h-full items-center justify-center'>
          <LoaderIcon
            size={20}
            className='animate-spin text-muted-foreground'
          />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className='h-full flex-col flex'>
        <div className='flex justify-between items-center px-4 py-2 h-12.25 border-b'>
          <p className='text-lg font-bold px-2 overflow-hidden truncate'>
            Thread
          </p>
          <Tooltip tooltip='Close' position='bottom'>
            <Button
              size='icon-sm'
              variant='ghost'
              type='button'
              onClick={onClose}
              className='text-lg font-bold px-2 overflow-hidden'
              aria-label='Close'
            >
              <XIcon aria-hidden='true' size={20} strokeWidth='1.5' />
            </Button>
          </Tooltip>
        </div>
        <div className='flex h-full items-center justify-center'>
          <AlertCircleIcon
            size={20}
            className='animate-spin text-muted-foreground'
          />
          <p className='text-sm text-muted-foreground'>Message not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full flex-col flex'>
      <div className='flex justify-between items-center px-4 py-2 h-12.25 border-b'>
        <p className='text-lg font-bold px-2 overflow-hidden truncate'>
          Thread
        </p>
        <Tooltip tooltip='Close' position='bottom'>
          <Button
            size='icon-sm'
            variant='ghost'
            type='button'
            onClick={onClose}
            className='text-lg font-bold px-2 overflow-hidden'
            aria-label='Close'
          >
            <XIcon aria-hidden='true' size={20} strokeWidth='1.5' />
          </Button>
        </Tooltip>
      </div>
      <div className='flex-1 flex flex-col-reverse pb-4 overflow-y-auto message-scrollbar'>
        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
          <div key={dateKey}>
            <div className='text-center my-2 relative'>
              <hr className='absolute top-1/2 left-0 right-0 border-t border-gray-300' />
              <span className='relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm'>
                {getDateGroupLabel(dateKey)}
              </span>
            </div>
            {messages?.map((message, index) => {
              const previousMsg = messages[index - 1];
              const isCompact =
                previousMsg &&
                previousMsg.member.id === message.member.id &&
                isSameDay(message.createdAt, previousMsg.createdAt);

              return (
                <Message
                  key={message.id}
                  id={message.id}
                  isCreator={message.member.id === currentMember?.id}
                  memberId={message.member.id}
                  authorImage={message.member.image}
                  authorName={message.member.name}
                  reactions={message.reactions}
                  isEditing={message.id === editingId}
                  onEditingIdChange={setEditingId}
                  body={message.body}
                  file={message.file}
                  createdAt={message.createdAt}
                  updatedAt={message.updatedAt}
                  isCompact={isCompact}
                  withThreadButton={false}
                  replyCount={message.replyCount}
                />
              );
            })}
          </div>
        ))}
        <div
          className='h-1'
          ref={node => {
            if (node) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting && hasNextPage) {
                    fetchNextPage();
                  }
                },
                {
                  threshold: 1.0,
                },
              );
              observer.observe(node);

              return () => {
                observer.unobserve(node);
                observer.disconnect();
              };
            }
          }}
        />
        {isFetchingNextPage && (
          <div className='text-center my-2 relative'>
            <hr className='absolute top-1/2 left-0 right-0 border-t border-gray-300' />
            <span className='relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm'>
              <LoaderIcon size={16} className='animate-spin' />
            </span>
          </div>
        )}
        <Message
          withThreadButton={false}
          memberId={message.member.id}
          authorImage={message.member.image}
          authorName={message.member.name}
          isCreator={message.member.id === currentMember?.id}
          body={message.body}
          file={message.file}
          createdAt={message.createdAt}
          updatedAt={message.updatedAt}
          reactions={message.reactions}
          isCompact={false}
          id={message.id}
          isEditing={editingId === message.id}
          onEditingIdChange={setEditingId}
          replyCount={message.replyCount}
        />
      </div>
      <ReplyMessageComposer
        workspaceId={workspaceId}
        threadId={message.id}
        channelId={channelId}
      />
    </div>
  );
}

function ReplyMessageComposer({
  workspaceId,
  threadId,
  channelId,
}: {
  workspaceId: string;
  threadId: string;
  channelId?: string;
}) {
  const {mutateSync, isPending} = useCreateMessageMutation();

  return (
    <div className='px-4'>
      <ClientOnly fallback='Reply editor'>
        <BaseEditor
          onSend={data =>
            mutateSync({...data, channelId, workspaceId, threadId})
          }
          disabled={isPending}
          placeholder='Reply...'
          withEmojiButton
          withSendButton
          withImageButton
        />
      </ClientOnly>
    </div>
  );
}
