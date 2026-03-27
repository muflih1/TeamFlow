import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useListChannelsQuery({workspaceId}: {workspaceId: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.channels.list.queryOptions({workspaceId}));
}
