import {useTRPC} from '@/lib/trpc';
import {useInfiniteQuery} from '@tanstack/react-query';

export function usePaginatedMessagesQuery(queryOptions: {
  workspaceId: string;
  channelId?: string;
  parentMessageId?: string;
  conversationId?: string;
}) {
  const trpc = useTRPC();

  return useInfiniteQuery(
    trpc.messages.list.infiniteQueryOptions(queryOptions, {
      getNextPageParam: lastPage => lastPage.nextCursor,
    }),
  );
}
