import {Router} from 'express';
import authRouter from './auth.route.js';
import {createExpressMiddleware} from '@trpc/server/adapters/express';
import {appRouter} from '../trpc/routers/_app.js';
import {createTRPCContext} from '../trpc/context.js';

const router = Router();

router
  .use('/auth', authRouter)
  .use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
      allowBatching: true,
  }),
);

export default router;
