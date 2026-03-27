import {useQuery} from '@tanstack/react-query';
import {getCurrentUser} from '../lib/auth.functions';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'current-user'],
    queryFn: async () => await getCurrentUser(),
  });
}
