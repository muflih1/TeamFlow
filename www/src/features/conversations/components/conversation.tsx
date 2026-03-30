import {useGetMemberQuery} from '@/features/memberships/hooks/use-get-member-query';
import type {AppRouter} from '../../../../../api/src/trpc/routers/_app';
import {useMemberId} from '@/hooks/use-member-id';
import {usePaginatedMessagesQuery} from '@/features/channels/hooks/use-paginated-messages-query';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {LoaderIcon} from 'lucide-react';
import {Header} from './header';
import {ChatComposer} from './chat-composer';
import {MessageList} from '@/components/message-list';

type Props = {
  conversation: Awaited<ReturnType<AppRouter['conversations']['createOrGet']>>;
};

export function Conversation({conversation}: Props) {
  const memberId = useMemberId();
  const workspaceId = useWorkspaceId();

  const {data: member, isLoading: memberLoading} = useGetMemberQuery({
    id: memberId,
  });
  const {
    data: infiniteMessagesData,
    isLoading: messagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedMessagesQuery({workspaceId, conversationId: conversation.id});

  const messages =
    infiniteMessagesData?.pages.flatMap(page => page.items) ?? [];

  if (memberLoading || messagesLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <LoaderIcon size={24} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!member) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-sm text-muted-foreground'>
          Hmm...this member does't exist.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <Header member={member} onClick={() => {}} />
      <MessageList
        messages={messages}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        memberName={member.name}
        memberImage={member.image}
      />
      <ChatComposer
        workspaceId={workspaceId}
        conversationId={conversation.id}
      />
    </div>
  );
}
