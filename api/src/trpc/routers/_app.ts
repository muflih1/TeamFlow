import {TRPCError} from '@trpc/server';
import {signToken} from '../../lib/paseto.js';
import {getRequest} from '../../utils/request-response.js';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {channelsRouter} from './channels.router.js';
import {filesRouter} from './files.router.js';
import {membershipsRouter} from './memberships.router.js';
import {workspacesRouter} from './workspaces.router.js';
import {messagesRouter} from './messages.router.js';
import {reactionsRouter} from './reactions.router.js';
import {conversationsRouter} from './conversations.router.js';

export const appRouter = createTRPCRouter({
  workspaces: workspacesRouter,
  memberships: membershipsRouter,
  channels: channelsRouter,
  files: filesRouter,
  messages: messagesRouter,
  reactions: reactionsRouter,
  conversations: conversationsRouter,
  getSocketAuthToken: baseProcedure.mutation(async ({ctx}) => {
    const session = ctx.session;
    if (!session) {
      throw new TRPCError({code: 'UNAUTHORIZED'});
    }
    const request = getRequest();
    const ua = request.get('user-agent');
    const token = signToken({
      iss: 'SlackClone',
      sub: session.userId,
      sid: `${session.id}:${session.createdAt}`,
      exp: '5m',
      ua,
    });
    return {token};
  }),
});

export type AppRouter = typeof appRouter;
