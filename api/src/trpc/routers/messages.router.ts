import {z} from 'zod';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {TRPCError} from '@trpc/server';
import {
  filesTable,
  messagesTable,
  reactionsTable,
  usersTable,
  workspaceMembershipsTable,
} from '../../db/schema.js';
import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import {io} from '../../app.js';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {r2} from '../../lib/r2.js';
import {GetObjectCommand} from '@aws-sdk/client-s3';
import {env} from '../../lib/env.js';

export const messagesRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        body: z.string().nonempty(),
        workspaceId: z.ksuid().nonempty(),
        channelId: z.ksuid().nullable().optional(),
        parentMessageId: z.ksuid().nullable().optional(),
        imageId: z.ksuid().optional(),
        conversationId: z.ksuid().nullable().optional(),
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
      if (!membership) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      let _conversationId = input.conversationId;

      if (!input.conversationId && !input.channelId && input.parentMessageId) {
        const [parentMessage] = await ctx.db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.id, input.parentMessageId));
        if (!parentMessage) {
          throw new TRPCError({code: 'BAD_REQUEST'});
        }
        _conversationId = parentMessage.conversationId;
      }

      const [insertedMessage] = await ctx.db
        .insert(messagesTable)
        .values({
          memberId: membership.id,
          body: input.body,
          imageId: input.imageId,
          channelId: input.channelId,
          workspaceId: input.workspaceId,
          parentMessageId: input.parentMessageId,
          conversationId: _conversationId,
        })
        .returning();

      const [message] = await ctx.db
        .select({
          id: messagesTable.id,
          body: messagesTable.body,
          parentMessage: messagesTable.parentMessageId,
          file: {
            id: filesTable.id,
            name: filesTable.name,
            title: filesTable.title,
            mimetype: filesTable.mimetype,
            filetype: filesTable.filetype,
            prettyType: filesTable.prettyType,
            storageKey: filesTable.storageKey,
            size: filesTable.size,
            user: filesTable.memberId,
            workspace: filesTable.workspaceId,
            createdAt: filesTable.createdAt,
            updatedAt: filesTable.updatedAt,
          },
          workspace: messagesTable.workspaceId,
          channel: messagesTable.channelId,
          conversation: messagesTable.conversationId,
          member: {
            id: workspaceMembershipsTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: workspaceMembershipsTable.role,
            image: usersTable.imageObjectKey,
          },
          reactions: sql<null>`null`,
          createdAt: messagesTable.createdAt,
          updatedAt: messagesTable.updatedAt,
        })
        .from(messagesTable)
        .leftJoin(filesTable, eq(messagesTable.imageId, filesTable.id))
        .innerJoin(
          workspaceMembershipsTable,
          eq(messagesTable.memberId, workspaceMembershipsTable.id),
        )
        .innerJoin(
          usersTable,
          eq(workspaceMembershipsTable.userId, usersTable.id),
        )
        .leftJoin(
          reactionsTable,
          eq(reactionsTable.messageId, messagesTable.id),
        )
        .where(eq(messagesTable.id, insertedMessage!.id))
        .limit(1);

      io.to(input.workspaceId).emit('message_created', {
        data: await toResponse({
          ...message,
          replyCount: 0,
          replyUsersCount: 0,
          latestReplyAt: null,
          replyUsers: [],
          file: message?.file
            ? {
                ...message,
                url: await getSignedUrl(
                  r2,
                  new GetObjectCommand({
                    Bucket: env.R2_PRIMARY_STORAGE_BUCKET_NAME,
                    Key: message.file.storageKey,
                  }),
                ),
                storageKey: undefined,
              }
            : null,
        }),
      });

      return {ok: true, channel: input.channelId, message: insertedMessage};
    }),

  list: baseProcedure
    .input(
      z.object({
        workspaceId: z.ksuid().nonempty(),
        channelId: z.ksuid().optional(),
        conversationId: z.ksuid().nullable().optional(),
        parentMessageId: z.ksuid().optional(),
        cursor: z.ksuid().nullable().optional(),
      }),
    )
    .query(async ({ctx, input}) => {
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
      if (!membership) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      let _conversationId = input.conversationId;
      if (
        !input.conversationId &&
        !input.channelId &&
        input.parentMessageId != null
      ) {
        const [parentMessage] = await ctx.db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.id, input.parentMessageId));
        if (!parentMessage) {
          throw new TRPCError({code: 'BAD_REQUEST'});
        }
        _conversationId = parentMessage.conversationId;
      }

      const reactionsSubquery = ctx.db
        .select({
          messageId: sql<string>`grouped.message_id`.as('messageId'),

          reactions: sql<{value: string; count: number; reacted: boolean}[]>`
        COALESCE(
          json_agg(
            json_build_object(
              'value', grouped.value,
              'users', grouped.users,
              'count', grouped.count
            )
          ),
          '[]'
        )
      `.as('reactions'),
        })
        .from(
          ctx.db
            .select({
              message_id: reactionsTable.messageId,
              value: reactionsTable.value,

              count: sql<number>`count(*)`.as('count'),

              users: sql<(typeof reactionsTable.memberId)[]>`
                  array_agg(distinct ${reactionsTable.memberId})
                `.as('users'),
            })
            .from(reactionsTable)
            .groupBy(reactionsTable.messageId, reactionsTable.value)
            .as('grouped'),
        )
        .groupBy(sql`grouped.message_id`)
        .as('reactions_agg');

      const replyCountSubquery = ctx.db
        .select({
          parentMessageId: messagesTable.parentMessageId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(messagesTable)
        .where(isNotNull(messagesTable.parentMessageId))
        .groupBy(messagesTable.parentMessageId)
        .as('reply_count_subquery');

      const repliesMetaSubquery = ctx.db
        .select({
          parentMessageId: messagesTable.parentMessageId,
          replyUsersCount:
            sql<number>`count(distinct ${messagesTable.memberId})`.as(
              'reply_users_count',
            ),
          latestReplyAt: sql<Date>`max(${messagesTable.createdAt})`.as(
            'latest_reply_at',
          ),
          replyUsers: sql<
            (typeof messagesTable.memberId)[]
          >`array_agg(distinct ${messagesTable.memberId})`.as('reply_users'),
        })
        .from(messagesTable)
        .where(isNotNull(messagesTable.parentMessageId))
        .groupBy(messagesTable.parentMessageId)
        .as('replies_meta_subquery');

      const limit = 20;

      const consitions: SQLWrapper[] = [];

      if (input.channelId != null) {
        consitions.push(eq(messagesTable.channelId, input.channelId));
      } else {
        consitions.push(isNull(messagesTable.channelId));
      }
      if (input.parentMessageId != null) {
        consitions.push(
          eq(messagesTable.parentMessageId, input.parentMessageId),
        );
      } else {
        consitions.push(isNull(messagesTable.parentMessageId));
      }
      if (_conversationId != null) {
        consitions.push(eq(messagesTable.conversationId, _conversationId));
      } else {
        consitions.push(isNull(messagesTable.conversationId));
      }
      if (input.cursor) {
        consitions.push(lt(messagesTable.id, input.cursor));
      }

      const whereClause = and(...consitions);

      const items = await ctx.db
        .select({
          id: messagesTable.id,
          body: messagesTable.body,
          parentMessage: messagesTable.parentMessageId,
          file: {
            id: filesTable.id,
            name: filesTable.name,
            title: filesTable.title,
            mimetype: filesTable.mimetype,
            filetype: filesTable.filetype,
            prettyType: filesTable.prettyType,
            storageKey: filesTable.storageKey,
            size: filesTable.size,
            user: filesTable.memberId,
            workspace: filesTable.workspaceId,
            createdAt: filesTable.createdAt,
            updatedAt: filesTable.updatedAt,
          },
          workspace: messagesTable.workspaceId,
          channel: messagesTable.channelId,
          conversation: messagesTable.conversationId,
          member: {
            id: workspaceMembershipsTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: workspaceMembershipsTable.role,
            image: usersTable.imageObjectKey,
          },
          replyCount: sql<number>`coalesce(${replyCountSubquery.count}, 0)::integer`,
          replyUsersCount: sql<number>`coalesce(${repliesMetaSubquery.replyUsersCount}, 0)::integer`,
          latestReplayAt: repliesMetaSubquery.latestReplyAt,
          replyUsers: sql<
            (typeof messagesTable.memberId)[]
          >`coalesce(${repliesMetaSubquery.replyUsers}, '{}')`,
          reactions: reactionsSubquery.reactions,
          createdAt: messagesTable.createdAt,
          updatedAt: messagesTable.updatedAt,
        })
        .from(messagesTable)
        .leftJoin(
          repliesMetaSubquery,
          eq(repliesMetaSubquery.parentMessageId, messagesTable.id),
        )
        .leftJoin(
          replyCountSubquery,
          eq(replyCountSubquery.parentMessageId, messagesTable.id),
        )
        .leftJoin(
          reactionsSubquery,
          eq(reactionsSubquery.messageId, messagesTable.id),
        )
        .leftJoin(filesTable, eq(messagesTable.imageId, filesTable.id))
        .innerJoin(
          workspaceMembershipsTable,
          eq(messagesTable.memberId, workspaceMembershipsTable.id),
        )
        .innerJoin(
          usersTable,
          eq(workspaceMembershipsTable.userId, usersTable.id),
        )
        .where(whereClause)
        .orderBy(desc(messagesTable.id))
        .limit(limit + 1);

      let nextCursor: string | null = null;

      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {items: await Promise.all(items.map(toResponse)), nextCursor};
    }),

  delete: baseProcedure
    .input(
      z.object({
        messageId: z.ksuid().nonempty(),
        workspaceId: z.ksuid().nonempty(),
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
      if (!membership || membership.id !== message.memberId) {
        throw new TRPCError({code: 'UNAUTHORIZED'});
      }

      await ctx.db
        .delete(messagesTable)
        .where(eq(messagesTable.id, input.messageId));

      io.to(input.workspaceId).emit('message_deleted', {
        data: {
          id: input.messageId,
          channel: message.channelId,
          conversation: message.conversationId,
          parentMessage: message.parentMessageId,
        },
      });

      return {ok: true, channel: message.channelId, message: input.messageId};
    }),

  get: baseProcedure
    .input(
      z.object({
        messageId: z.ksuid().nonempty(),
        workspaceId: z.ksuid().nonempty(),
      }),
    )
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

      const reactionsSubquery = ctx.db
        .select({
          messageId: sql<string>`grouped.message_id`.as('messageId'),

          reactions: sql<{value: string; count: number; reacted: boolean}[]>`
        COALESCE(
          json_agg(
            json_build_object(
              'value', grouped.value,
              'users', grouped.users,
              'count', grouped.count
            )
          ),
          '[]'
        )
      `.as('reactions'),
        })
        .from(
          ctx.db
            .select({
              message_id: reactionsTable.messageId,
              value: reactionsTable.value,

              count: sql<number>`count(*)`.as('count'),

              users: sql<(typeof reactionsTable.memberId)[]>`
                  array_agg(distinct ${reactionsTable.memberId})
                `.as('users'),
            })
            .from(reactionsTable)
            .groupBy(reactionsTable.messageId, reactionsTable.value)
            .as('grouped'),
        )
        .groupBy(sql`grouped.message_id`)
        .as('reactions_agg');

      const replyCountSubquery = ctx.db
        .select({
          parentMessageId: messagesTable.parentMessageId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(messagesTable)
        .where(isNotNull(messagesTable.parentMessageId))
        .groupBy(messagesTable.parentMessageId)
        .as('reply_count_subquery');

      const [message] = await ctx.db
        .select({
          id: messagesTable.id,
          body: messagesTable.body,
          parentMessage: messagesTable.parentMessageId,
          file: {
            id: filesTable.id,
            name: filesTable.name,
            title: filesTable.title,
            mimetype: filesTable.mimetype,
            filetype: filesTable.filetype,
            prettyType: filesTable.prettyType,
            storageKey: filesTable.storageKey,
            size: filesTable.size,
            user: filesTable.memberId,
            workspace: filesTable.workspaceId,
            createdAt: filesTable.createdAt,
            updatedAt: filesTable.updatedAt,
          },
          workspace: messagesTable.workspaceId,
          channel: messagesTable.channelId,
          conversation: messagesTable.conversationId,
          member: {
            id: workspaceMembershipsTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: workspaceMembershipsTable.role,
            image: usersTable.imageObjectKey,
          },
          replyCount: sql<number>`coalesce(${replyCountSubquery.count}, 0)::integer`,
          reactions: reactionsSubquery.reactions,
          createdAt: messagesTable.createdAt,
          updatedAt: messagesTable.updatedAt,
        })
        .from(messagesTable)
        .leftJoin(
          replyCountSubquery,
          eq(replyCountSubquery.parentMessageId, messagesTable.id),
        )
        .leftJoin(
          reactionsSubquery,
          eq(reactionsSubquery.messageId, messagesTable.id),
        )
        .leftJoin(filesTable, eq(messagesTable.imageId, filesTable.id))
        .innerJoin(
          workspaceMembershipsTable,
          eq(messagesTable.memberId, workspaceMembershipsTable.id),
        )
        .innerJoin(
          usersTable,
          eq(workspaceMembershipsTable.userId, usersTable.id),
        )
        .where(eq(messagesTable.id, input.messageId))
        .limit(1);
      if (!message) {
        return null;
      }

      return await toResponse(message);
    }),
});

async function toResponse(body: any): Promise<{
  id: string;
  body: string;
  parentMessage: string | null;
  file: {
    id: string;
    name: string;
    title: string;
    mimetype: string;
    filetype: string;
    prettyType: string;
    url: string | null;
    size: string;
    user: string;
    workspace: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  workspace: string;
  channel: string | null;
  conversation: string | null;
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
  };
  replyCount: number;
  replyUsersCount: number;
  latestReplyAt: Date | null;
  replyUsers: string[];
  reactions: Array<{value: string; users: string[]; count: number}> | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  const url =
    body.file !== null
      ? await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: env.R2_PRIMARY_STORAGE_BUCKET_NAME,
            Key: body.file.storageKey,
          }),
        )
      : null;

  return {
    id: body.id,
    body: body.body,
    parentMessage: body.parentMessage,
    file:
      body.file !== null
        ? {
            id: body.file.id,
            name: body.file.name,
            title: body.file.title,
            mimetype: body.file.mimetype,
            filetype: body.file.filetype,
            prettyType: body.file.prettyType,
            url,
            size: body.file.size,
            user: body.file.user,
            workspace: body.file.workspace,
            createdAt: body.file.createdAt,
            updatedAt: body.file.updatedAt,
          }
        : null,
    workspace: body.workspace,
    channel: body.channel,
    conversation: body.conversation,
    member: {
      id: body.member.id,
      name: body.member.name,
      email: body.member.email,
      role: body.member.role,
      image: null,
    },
    replyCount: body.replyCount,
    replyUsersCount: body.replyUsersCount,
    latestReplyAt: body.latestReplayAt,
    replyUsers: body.replyUsers,
    reactions: body.reactions,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  };
}
