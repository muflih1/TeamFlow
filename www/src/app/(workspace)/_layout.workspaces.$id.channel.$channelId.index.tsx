import {MessageList} from '@/components/message-list';
import {ChannelHeader} from '@/features/channels/components/channel-header';
import {MessageComposer} from '@/features/channels/components/message-composer';
import {useListMessagesQuery} from '@/features/channels/hooks/use-list-messages-query';
import {usePaginatedMessagesQuery} from '@/features/channels/hooks/use-paginated-messages-query';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {usePanel} from '@/hooks/use-panel';
import {useTRPC} from '@/lib/trpc';
import {useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {AlertCircleIcon} from 'lucide-react';
import {useEffect} from 'react';

export const Route = createFileRoute(
  '/(workspace)/_layout/workspaces/$id/channel/$channelId/',
)({
  component: RouteComponent,
  loader: async ({context, params}) => {
    await context.queryClient.prefetchQuery(
      context.trpc.channels.get.queryOptions({id: params.channelId}),
    );
  },
});

function RouteComponent() {
  const workspaceId = useWorkspaceId();
  const channelId = Route.useParams({select: params => params.channelId});
  const trpc = useTRPC();
  const {threadId, onClose} = usePanel();

  useEffect(() => {
    return () => {
      if (threadId !== null) {
        onClose();
      }
    };
  }, [threadId, channelId]);

  const {data: channel} = useSuspenseQuery(
    trpc.channels.get.queryOptions({id: channelId}),
  );

  const {
    data: paginatedMessagesData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePaginatedMessagesQuery({channelId, workspaceId});

  if (!channel) {
    return (
      <div className='h-full flex flex-1 flex-col gap-y-2 items-center justify-center'>
        <AlertCircleIcon size={24} className='text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Channel not found</span>
      </div>
    );
  }

  const messages =
    paginatedMessagesData?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className='flex flex-col h-full'>
      <ChannelHeader channel={channel} />
      <MessageList
        channelName={channel.name}
        channelCreatedAt={channel.createdAt}
        messages={messages}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <MessageComposer />
    </div>
  );
}
