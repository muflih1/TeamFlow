import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useGetChannel({channelId}: {channelId: string}) {
  const trpc = useTRPC();
  return useQuery(trpc.channels.get.queryOptions({id: channelId}));
}
