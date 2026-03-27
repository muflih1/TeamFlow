import {createRouter as createTanStackRouter} from '@tanstack/react-router';
import {routeTree} from './routeTree.gen';
import {getReactQueryClient} from './lib/react-query-client';
import {setupRouterSsrQueryIntegration} from '@tanstack/react-router-ssr-query';
import {TRPCProvider} from './lib/trpc';
import {getTRPCClient} from './utils/trpc-client';
import {createTRPCOptionsProxy} from '@trpc/tanstack-react-query';
import type {AppRouter} from '../../api/src/trpc/routers/_app';

export function getRouter() {
  const queryClient = getReactQueryClient();
  const trpcClient = getTRPCClient();
  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
      trpc,
    },
    Wrap: props => (
      <TRPCProvider
        queryClient={queryClient}
        trpcClient={trpcClient}
        {...props}
      />
    ),
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({
    queryClient,
    router,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
