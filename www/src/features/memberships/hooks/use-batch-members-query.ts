import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useBatchMembersQuery(ids: string[]) {
  const trpc = useTRPC();
  return useQuery(trpc.memberships.batch.queryOptions({ids}));
}
