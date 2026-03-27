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
import {and, desc, eq, sql} from 'drizzle-orm';
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
        channelId: z.ksuid().optional(),
        parentMessageId: z.ksuid().optional(),
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
          reactions: sql<null>`NULL`,
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

      io.to(input.workspaceId).emit('message', {
        data: {
          ...message,
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
        },
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
        paging: z.object({}).optional(),
      }),
    )
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

      const reactionsAgg = (memberId: string) =>
        ctx.db
          .select({
            messageId: sql<string>`grouped.message_id`.as('messageId'),

            reactions: sql<{value: string; count: number; reacted: boolean}[]>`
        COALESCE(
          json_agg(
            json_build_object(
              'value', grouped.value,
              'count', grouped.count,
              'reacted', grouped.reacted
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

                count: sql<number>`COUNT(*)`.as('count'),

                reacted: sql<boolean>`
            BOOL_OR(${reactionsTable.memberId} = ${memberId})
          `.as('reacted'),
              })
              .from(reactionsTable)
              .groupBy(reactionsTable.messageId, reactionsTable.value)
              .as('grouped'),
          )
          .groupBy(sql`grouped.message_id`)
          .as('reactions_agg');

      const reactionsSubquery = reactionsAgg(membership.id);

      const result = await ctx.db
        .select({
          id: messagesTable.id,
          body: messagesTable.body,
          parentMessageId: messagesTable.parentMessageId,
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
          workspaceId: messagesTable.workspaceId,
          channelId: messagesTable.channelId,
          conversationId: messagesTable.conversationId,
          member: {
            id: workspaceMembershipsTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: workspaceMembershipsTable.role,
            image: usersTable.imageObjectKey,
          },
          reactions: reactionsSubquery.reactions,
          createdAt: messagesTable.createdAt,
          updatedAt: messagesTable.updatedAt,
        })
        .from(messagesTable)
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
        .leftJoin(
          reactionsTable,
          eq(reactionsTable.messageId, messagesTable.id),
        )
        .where(eq(messagesTable.channelId, input.channelId!))
        .orderBy(desc(messagesTable.id))
        .limit(50);

      return await Promise.all(
        result.map(async message => {
          const url =
            message.file !== null
              ? await getSignedUrl(
                  r2,
                  new GetObjectCommand({
                    Bucket: env.R2_PRIMARY_STORAGE_BUCKET_NAME,
                    Key: message.file.storageKey,
                  }),
                )
              : null;

          return {
            id: message.id,
            body: message.body,
            parentMessage: message.parentMessageId,
            file:
              message.file !== null
                ? {
                    id: message.file.id,
                    name: message.file.name,
                    title: message.file.title,
                    mimetype: message.file.mimetype,
                    filetype: message.file.filetype,
                    prettyType: message.file.prettyType,
                    url,
                    size: message.file.size,
                    user: message.file.user,
                    workspace: message.file.workspace,
                    createdAt: message.file.createdAt,
                    updatedAt: message.file.updatedAt,
                  }
                : null,
            workspace: message.workspaceId,
            channel: message.channelId,
            conversation: message.conversationId,
            member: {
              id: message.member.id,
              name: message.member.name,
              email: message.member.email,
              role: message.member.role,
              image: null,
            },
            reactions: message.reactions,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          };
        }),
      );
    }),
});
