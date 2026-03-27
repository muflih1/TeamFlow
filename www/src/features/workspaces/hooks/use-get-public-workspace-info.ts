import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useGetPublicWorkspaceInfo({workspaceId}: {workspaceId: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.workspaces.getPublicInfo.queryOptions({workspaceId}));
}
