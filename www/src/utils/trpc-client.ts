import {createIsomorphicFn} from '@tanstack/react-start';
import {createTRPCClient, httpBatchLink} from '@trpc/client';
import superjson from 'superjson';
import type {AppRouter} from '../../../api/src/trpc/routers/_app';
import {getRequestHeaders} from '@tanstack/react-start/server';

export const getTRPCClient = createIsomorphicFn()
  .server(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${import.meta.env.VITE_APP_SERVER_URL}/api/trpc`,
          headers: Object.fromEntries(getRequestHeaders()),
          transformer: superjson,
        }),
      ],
    }),
  )
  .client(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          fetch: (url, options) =>
            fetch(url, {...options, credentials: 'include'}),
          transformer: superjson,
        }),
      ],
    }),
  );
