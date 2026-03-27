import {QueryClient} from '@tanstack/react-query';

export function getReactQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}
