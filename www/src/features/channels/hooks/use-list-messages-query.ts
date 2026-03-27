import {useTRPC} from '@/lib/trpc';
import {useQuery} from '@tanstack/react-query';

export function useListMessagesQuery(queryOptions?: any) {
  const trpc = useTRPC();
  return useQuery(trpc.messages.list.queryOptions(queryOptions));
}
