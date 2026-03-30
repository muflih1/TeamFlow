import {and, eq, inArray} from 'drizzle-orm';
import {usersTable, workspaceMembershipsTable} from '../../db/schema.js';
import {baseProcedure, createTRPCRouter} from '../init.js';
import z from 'zod';
import {ROLE_PERMISSIONS} from '../../utils/permission.js';

export const membershipsRouter = createTRPCRouter({
  current: baseProcedure
    .input(z.object({workspaceId: z.ksuid()}))
    .query(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        return null;
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
        return null;
      }

      return {
        id: membership.id,
        userId: membership.userId,
        workspaceId: membership.workspaceId,
        role: membership.role,
        permissions: new Set(ROLE_PERMISSIONS[membership.role]),
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      };
    }),

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

      const memberships = await ctx.db
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
        .where(eq(workspaceMembershipsTable.workspaceId, input.workspaceId));

      return memberships.map(m => ({
        ...m,
        permissions: new Set(ROLE_PERMISSIONS[m.role]),
      }));
    }),

  get: baseProcedure
    .input(z.object({id: z.ksuid().nonempty()}))
    .query(async ({ctx, input}) => {
      const userId = ctx.session?.userId;
      if (!userId) {
        return null;
      }

      const [member] = await ctx.db
        .select({
          id: workspaceMembershipsTable.id,
          role: workspaceMembershipsTable.role,
          name: usersTable.name,
          email: usersTable.email,
          image: usersTable.imageObjectKey,
        })
        .from(workspaceMembershipsTable)
        .innerJoin(
          usersTable,
          eq(usersTable.id, workspaceMembershipsTable.userId),
        )
        .where(eq(workspaceMembershipsTable.id, input.id))
        .limit(1);
      if (!member) {
        return null;
      }

      return member;
    }),

  batch: baseProcedure
    .input(z.object({ids: z.array(z.ksuid().nonoptional())}))
    .query(async ({ctx, input}) => {
      const memberships = await ctx.db
        .select({
          id: workspaceMembershipsTable.id,
          name: usersTable.name,
          image: usersTable.imageObjectKey,
        })
        .from(workspaceMembershipsTable)
        .innerJoin(
          usersTable,
          eq(workspaceMembershipsTable.userId, usersTable.id),
        )
        .where(inArray(workspaceMembershipsTable.id, input.ids));
      
        return memberships;
    }),
});
