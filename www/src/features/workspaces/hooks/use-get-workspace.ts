import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useGetWorkspace(workspaceId: string) {
  const trpc = useTRPC();
  return useQuery(trpc.workspaces.get.queryOptions({id: workspaceId}));
}
