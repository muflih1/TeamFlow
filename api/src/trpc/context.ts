import type {CreateExpressContextOptions} from '@trpc/server/adapters/express';
import {db} from '../db/index.js';

export async function createTRPCContext(opts: CreateExpressContextOptions) {
  return {
    db,
    session: opts.req.session
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
