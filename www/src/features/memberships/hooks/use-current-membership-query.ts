import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useCurrentMembershipQuery({workspaceId}: {workspaceId: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.memberships.current.queryOptions({workspaceId}));
}
