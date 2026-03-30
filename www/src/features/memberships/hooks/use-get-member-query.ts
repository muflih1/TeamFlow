import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useGetMemberQuery({id}: {id: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.memberships.get.queryOptions({id}));
}
