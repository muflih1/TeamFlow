import {MessageList} from '@/components/message-list';
import {ChannelHeader} from '@/features/channels/components/channel-header';
import {MessageComposer} from '@/features/channels/components/message-composer';
import {useListMessagesQuery} from '@/features/channels/hooks/use-list-messages-query';
import {useWorkspaceId} from '@/features/workspaces/hooks/use-workspace-id';
import {useTRPC} from '@/lib/trpc';
import {useSuspenseQuery} from '@tanstack/react-query';
import {createFileRoute} from '@tanstack/react-router';
import {AlertCircleIcon} from 'lucide-react';

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

  const {data: channel} = useSuspenseQuery(
    trpc.channels.get.queryOptions({id: channelId}),
  );

  const {data: messages} = useListMessagesQuery({channelId, workspaceId});

  if (!channel) {
    return (
      <div className='h-full flex flex-1 flex-col gap-y-2 items-center justify-center'>
        <AlertCircleIcon size={24} className='text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Channel not found</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <ChannelHeader channel={channel} />
      <MessageList
        channelName={channel.name}
        channelCreatedAt={channel.createdAt}
        messages={messages}
      />
      <MessageComposer />
    </div>
  );
}
