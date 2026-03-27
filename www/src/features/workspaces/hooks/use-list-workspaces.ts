import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useListWorkspaces() {
  const trpc = useTRPC();
  return useQuery(trpc.workspaces.list.queryOptions());
}
