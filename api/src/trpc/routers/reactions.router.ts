import z from 'zod';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {TRPCError} from '@trpc/server';
import {
  messagesTable,
  reactionsTable,
  workspaceMembershipsTable,
} from '../../db/schema.js';
import {and, eq} from 'drizzle-orm';
import {io} from '../../app.js';

export const reactionsRouter = createTRPCRouter({
  toggle: baseProcedure
    .input(
      z.object({
        workspaceId: z.ksuid().nonempty(),
        messageId: z.ksuid().nonempty(),
        value: z.emoji(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const [message] = await ctx.db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, input.messageId));
      if (!message) {
        throw new TRPCError({code: 'NOT_FOUND'});
      }

      const [membership] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, input.workspaceId),
          ),
        );
      if (!membership) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const [hasReacted] = await ctx.db
        .select()
        .from(reactionsTable)
        .where(
          and(
            eq(reactionsTable.messageId, input.messageId),
            eq(reactionsTable.memberId, membership.id),
            eq(reactionsTable.value, input.value),
          ),
        )
        .limit(1);
      if (hasReacted) {
        await ctx.db
          .delete(reactionsTable)
          .where(eq(reactionsTable.id, hasReacted.id));
        io.to(input.workspaceId).emit('reaction_deleted', {
          data: {
            value: hasReacted.value,
            user: hasReacted.memberId,
            channel: message.channelId,
            message: message.id,
            parentMessage: message.parentMessageId,
            conversation: message.conversationId,
          },
        });
        return {ok: true};
      }
      await ctx.db.insert(reactionsTable).values({
        value: input.value,
        memberId: membership.id,
        messageId: input.messageId,
        workspaceId: input.workspaceId,
      });
      io.to(input.workspaceId).emit('reaction_added', {
        data: {
          value: input.value,
          user: membership.id,
          channel: message.channelId,
          message: message.id,
          parentMessage: message.parentMessageId,
          conversation: message.conversationId,
        },
      });
      return {ok: true};
    }),
});
