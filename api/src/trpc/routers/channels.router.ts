import z from 'zod';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {channelsTable, workspaceMembershipsTable} from '../../db/schema.js';
import {and, eq} from 'drizzle-orm';
import {TRPCError} from '@trpc/server';
import {has} from '../../utils/permission.js';
import {io} from '../../app.js';

export const channelsRouter = createTRPCRouter({
  list: baseProcedure
    .input(z.object({workspaceId: z.ksuid().nonempty()}))
    .query(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        return [];
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
      if (!membership) {
        return [];
      }

      const channels = await ctx.db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.workspaceId, input.workspaceId));

      return channels;
    }),

  create: baseProcedure
    .input(
      z.object({
        name: z.string().nonempty(),
        workspaceId: z.ksuid().nonempty(),
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
      if (!membership || !has(membership, 'org:channels:create')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const serializedName = input.name.replace(/\s+/g, '-').toLowerCase();

      const [channel] = await ctx.db
        .insert(channelsTable)
        .values({name: serializedName, workspaceId: input.workspaceId})
        .returning();

      io.to(input.workspaceId).emit('channel_created', {
        data: channel,
      });

      return channel;
    }),

  get: baseProcedure
    .input(z.object({id: z.ksuid().nonempty()}))
    .query(async ({ctx, input}) => {
      console.log({first: true}, 'channels.get');
      const userId = ctx.session?.userId;
      if (!userId) {
        console.log({userId});
        return null;
      }

      const [channel] = await ctx.db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, input.id));
      if (!channel) {
        return null;
      }

      const [membership] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, channel.workspaceId),
          ),
        )
        .limit(1);
      if (!membership || !has(membership, 'org:channels:read')) {
        return null;
      }

      return channel;
    }),

  update: baseProcedure
    .input(
      z.object({
        id: z.ksuid().nonempty(),
        name: z.string().min(3).max(80),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const [channel] = await ctx.db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, input.id));
      if (!channel) {
        throw new TRPCError({code: 'NOT_FOUND'});
      }

      const [membership] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, channel.workspaceId),
          ),
        )
        .limit(1);
      if (!membership || !has(membership, 'org:channels:update')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const serializedName = input.name.replace(/\s+/g, '-').toLowerCase();

      const [updated] = await ctx.db
        .update(channelsTable)
        .set({name: serializedName})
        .where(eq(channelsTable.id, input.id))
        .returning();

      io.to(channel.workspaceId).emit('channel_updated', {
        data: updated,
      });

      return updated;
    }),

  delete: baseProcedure
    .input(
      z.object({
        id: z.ksuid().nonempty(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      const [channel] = await ctx.db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, input.id));
      if (!channel) {
        throw new TRPCError({code: 'NOT_FOUND'});
      }

      const [membership] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, channel.workspaceId),
          ),
        )
        .limit(1);
      if (!membership || !has(membership, 'org:channels:delete')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      await ctx.db.delete(channelsTable).where(eq(channelsTable.id, input.id));

      io.to(channel.workspaceId).emit('channel_deleted', {
        data: {channelId: input.id},
      });

      return {deleted: true, channelId: input.id};
    }),
});
