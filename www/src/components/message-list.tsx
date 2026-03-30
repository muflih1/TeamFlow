import type {AppRouter} from '../../../api/src/trpc/routers/_app';
import {format, isSameDay} from 'date-fns';
import {Message} from './message';
import {ChannelHero} from '@/features/channels/components/channel-hero';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useCurrentMembershipQuery} from '@/features/memberships/hooks/use-current-membership-query';
import {useState} from 'react';
import {LoaderIcon} from 'lucide-react';
import {getDateGroupLabel} from '@/utils/get-date-group-label';
import {ConversationHero} from '@/features/conversations/components/conversation-hero';

type Props = {
  memberName?: string;
  memberImage?: string | null;
  channelName?: string;
  channelCreatedAt?: Date;
  messages:
    | Awaited<ReturnType<AppRouter['messages']['list']>>['items']
    | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export function MessageList({
  memberName,
  memberImage,
  channelName,
  channelCreatedAt,
  messages,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: Props) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const workspaceId = useWorkspaceId();

  const {data: currentMember} = useCurrentMembershipQuery({workspaceId});

  const groupedMessages = messages?.reduce(
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

  return (
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
                isEditing={message.id === editingMessageId}
                onEditingIdChange={setEditingMessageId}
                body={message.body}
                file={message.file}
                createdAt={message.createdAt}
                updatedAt={message.updatedAt}
                isCompact={isCompact}
                replyCount={message.replyCount}
                replyUsersCount={message.replyUsersCount}
                replyUsers={message.replyUsers}
                latestReplyAt={message.latestReplyAt}
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
      {channelName && channelCreatedAt && (
        <ChannelHero name={channelName} createdAt={channelCreatedAt} />
      )}
      {memberName != null && (
        <ConversationHero name={memberName} image={memberImage} />
      )}
    </div>
  );
}
