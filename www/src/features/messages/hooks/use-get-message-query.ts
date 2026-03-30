import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useGetMessageQuery({
  messageId,
  workspaceId,
}: {
  messageId: string;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  return useQuery(trpc.messages.get.queryOptions({messageId, workspaceId}));
}
