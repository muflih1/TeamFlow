import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useListMembers({workspaceId}: {workspaceId: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.memberships.list.queryOptions({workspaceId}));
}
