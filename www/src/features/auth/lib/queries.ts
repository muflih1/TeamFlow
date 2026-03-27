import {queryOptions} from '@tanstack/react-query';
import {getCurrentUser} from './auth.functions';

export const authQueries = {
  getCurrentUser: {
    queryOptions: () =>
      queryOptions({
        queryKey: ['auth', 'current-user'],
        queryFn: () => getCurrentUser(),
        staleTime: Infinity,
        refetchOnWindowFocus: false
      }),
  },
};
