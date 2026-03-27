import {TRPCError} from '@trpc/server';
import {baseProcedure, createTRPCRouter} from '../init.js';
import crypto from 'node:crypto';
import {
  channelsTable,
  usersTable,
  workspaceMembershipsTable,
  workspacesTable,
} from '../../db/schema.js';
import z from 'zod';
import {and, eq} from 'drizzle-orm';
import {has, ROLE_PERMISSIONS} from '../../utils/permission.js';
import {io} from '../../app.js';

function generateCode() {
  return Array.from({length: 6}, () =>
    '23456789abcdefghijkmnpqrstuvwxyz'.charAt(crypto.randomInt(32)),
  ).join('');
}

export const workspacesRouter = createTRPCRouter({
  create: baseProcedure
    .input(z.object({name: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      if (!ctx.session.userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }
      const code = generateCode();
      return await ctx.db.transaction(async tx => {
        const [workspace] = await tx
          .insert(workspacesTable)
          .values({name: input.name, joinCode: code})
          .returning();
        await tx.insert(workspaceMembershipsTable).values({
          userId: ctx.session.userId,
          workspaceId: workspace!.id,
          role: 'org:owner',
        });
        await tx
          .insert(channelsTable)
          .values({name: 'general', workspaceId: workspace!.id});

        return {workspace};
      });
    }),

  list: baseProcedure.query(async ({ctx}) => {
    const userId = ctx.session?.userId;
    if (!userId) {
      return [];
    }
    const rows = await ctx.db
      .select({
        id: workspacesTable.id,
        name: workspacesTable.name,
        joinCode: workspacesTable.joinCode,
        createdAt: workspacesTable.createdAt,
      })
      .from(workspaceMembershipsTable)
      .innerJoin(
        workspacesTable,
        eq(workspacesTable.id, workspaceMembershipsTable.workspaceId),
      )
      .where(eq(workspaceMembershipsTable.userId, userId));

    return rows;
  }),

  getPublicInfo: baseProcedure
    .input(z.object({workspaceId: z.ksuid().nonempty()}))
    .query(async ({ctx, input}) => {
      const userId = ctx.session?.userId;

      if (!userId) {
        return null;
      }

      const [row] = await ctx.db
        .select({
          id: workspacesTable.id,
          name: workspacesTable.name,
          role: workspaceMembershipsTable.role,
        })
        .from(workspacesTable)
        .leftJoin(
          workspaceMembershipsTable,
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, workspacesTable.id),
          ),
        )
        .where(eq(workspaceMembershipsTable.workspaceId, input.workspaceId))
        .limit(1);

      if (!row) {
        return null;
      }

      return {id: row.id, name: row.name, isMember: row.role !== null};
    }),

  get: baseProcedure
    .input(z.object({id: z.ksuid()}))
    .query(async ({ctx, input}) => {
      const userId = ctx.session?.userId;

      if (!userId) {
        return null;
      }

      const [rows] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .innerJoin(
          workspacesTable,
          eq(workspacesTable.id, workspaceMembershipsTable.workspaceId),
        )
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, input.id),
          ),
        )
        .limit(1);

      return rows?.workspaces ?? null;
    }),

  update: baseProcedure
    .input(z.object({id: z.ksuid().nonempty(), name: z.string().min(3)}))
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
            eq(workspaceMembershipsTable.workspaceId, input.id),
          ),
        )
        .limit(1);
      if (!membership || !has(membership, 'org:profile:manage')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const [updated] = await ctx.db
        .update(workspacesTable)
        .set({name: input.name})
        .where(eq(workspacesTable.id, input.id))
        .returning();

      io.to(`workspace:${input.id}`).emit('workspace_updated', {data: updated});

      return updated;
    }),

  delete: baseProcedure
    .input(z.object({id: z.ksuid().nonempty()}))
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
            eq(workspaceMembershipsTable.workspaceId, input.id),
          ),
        )
        .limit(1);
      if (!membership || !has(membership, 'org:profile:delete')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      await ctx.db
        .delete(workspacesTable)
        .where(eq(workspacesTable.id, input.id));

      io.to(membership.workspaceId).emit('workspace_deleted', {
        data: {workspaceId: input.id},
      });

      return {success: true};
    }),

  newJoinCode: baseProcedure
    .input(z.object({workspaceId: z.ksuid().nonempty()}))
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
      if (!membership || !has(membership, 'org:memberships:invite')) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const newJoinCode = generateCode();
      const [workspace] = await ctx.db
        .update(workspacesTable)
        .set({joinCode: newJoinCode})
        .where(eq(workspacesTable.id, input.workspaceId))
        .returning();
      if (!workspace) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR'});
      }

      io.to(input.workspaceId).emit('join_code_updated', {data: workspace});

      return workspace;
    }),

  join: baseProcedure
    .input(
      z.object({
        code: z.string().nonempty().length(6),
        workspaceId: z.ksuid().nonempty(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }
      const [workspace] = await ctx.db
        .select()
        .from(workspacesTable)
        .where(eq(workspacesTable.id, input.workspaceId));
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }
      if (workspace.joinCode !== input.code.toLowerCase()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid join code',
        });
      }
      const [exists] = await ctx.db
        .select()
        .from(workspaceMembershipsTable)
        .where(
          and(
            eq(workspaceMembershipsTable.userId, userId),
            eq(workspaceMembershipsTable.workspaceId, input.workspaceId),
          ),
        )
        .limit(1);
      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already a member of this workspace',
        });
      }

      const [newMember] = await ctx.db
        .insert(workspaceMembershipsTable)
        .values({userId, workspaceId: input.workspaceId, role: 'org:member'})
        .returning({id: workspaceMembershipsTable.id});

      const [data] = await ctx.db
        .select({
          id: workspaceMembershipsTable.id,
          role: workspaceMembershipsTable.role,
          userId: workspaceMembershipsTable.userId,
          workspaceId: workspaceMembershipsTable.workspaceId,
          createdAt: workspaceMembershipsTable.createdAt,
          updatedAt: workspaceMembershipsTable.updatedAt,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
          },
        })
        .from(workspaceMembershipsTable)
        .innerJoin(
          usersTable,
          eq(usersTable.id, workspaceMembershipsTable.userId),
        )
        .where(eq(workspaceMembershipsTable.id, newMember!.id));

      io.to(input.workspaceId).emit('member_joined', {
        data: {...data, permissions: new Set(ROLE_PERMISSIONS[data!.role])},
      });

      return {id: input.workspaceId};
    }),
});
