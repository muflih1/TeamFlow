import z from 'zod';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {TRPCError} from '@trpc/server';
import {and, eq, or} from 'drizzle-orm';
import {
  conversationsTable,
  workspaceMembershipsTable,
} from '../../db/schema.js';

export const conversationsRouter = createTRPCRouter({
  createOrGet: baseProcedure
    .input(
      z.object({
        workspaceId: z.ksuid().nonempty(),
        memberId: z.ksuid().nonempty(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const [membership] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, input.workspaceId),
          ),
        )
        .limit(1);

      const [otherMember] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.id, input.memberId),
            eq(workspaceMembershipsTable.workspaceId, input.workspaceId),
          ),
        )
        .limit(1);

      if (!membership || !otherMember) {
        throw new TRPCError({code: 'NOT_FOUND'});
      }

      const [existingConversation] = await ctx.db
        .select()
        .from(conversationsTable)
        .where(
          and(
            eq(conversationsTable.workspaceId, input.workspaceId),
            or(
              and(
                eq(conversationsTable.memberOneId, membership.id),
                eq(conversationsTable.memberTwoId, otherMember.id),
              ),
              and(
                eq(conversationsTable.memberOneId, otherMember.id),
                eq(conversationsTable.memberTwoId, membership.id),
              ),
            ),
          ),
        )
        .limit(1);
      if (existingConversation) {
        return existingConversation;
      }

      const [conversation] = await ctx.db
        .insert(conversationsTable)
        .values({
          workspaceId: input.workspaceId,
          memberOneId: membership.id,
          memberTwoId: otherMember.id,
        })
        .onConflictDoNothing()
        .returning();
      if (!conversation) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR'});
      }

      return conversation;
    }),
});
