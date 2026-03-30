import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import {Provider} from 'jotai';

import appCss from '../styles.css?url';
import type {QueryClient} from '@tanstack/react-query';
import type {TRPCOptionsProxy} from '@trpc/tanstack-react-query';
import type {AppRouter} from '../../../api/src/trpc/routers/_app';
import {DialogProvider} from '@/contexts/dialog-context';
import {Toaster} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {RouteLoadingBar} from '@/components/route-loading-bar';
import { ThreadMessageContextProvider } from '@/contexts/thread-message-context';

type RouterContext = {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({children}: {children: React.ReactNode}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className='overflow-y-scroll light'
    >
      <head>
        <HeadContent />
      </head>
      <body className='font-sans overflow-y-visible antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]'>
        <RouteLoadingBar />
        <Provider>
          <DialogProvider>
            <TooltipProvider>
              <ThreadMessageContextProvider>
                {children}
              </ThreadMessageContextProvider>
            </TooltipProvider>
          </DialogProvider>
          <Toaster />
        </Provider>
        <Scripts />
      </body>
    </html>
  );
}
