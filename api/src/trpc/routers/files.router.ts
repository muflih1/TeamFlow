import {z} from 'zod';
import {baseProcedure, createTRPCRouter} from '../init.js';
import {TRPCError} from '@trpc/server';
import {and, eq} from 'drizzle-orm';
import {filesTable, workspaceMembershipsTable} from '../../db/schema.js';
import {ksuid} from '../../lib/ksuid.js';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {r2} from '../../lib/r2.js';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {env} from '../../lib/env.js';

export const filesRouter = createTRPCRouter({
  getUploadURL: baseProcedure
    .input(
      z.object({
        filename: z.string().nonempty(),
        size: z.number().nonnegative(),
        mimetype: z.string().nonempty(),
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
      if (!membership) {
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const id = ksuid.generate();
      const key = `files-pri/${input.workspaceId}-${id}/${input.filename}`;
      const filetype = getFileType(input.mimetype);
      const prettyType = getFilePrettyType(filetype);
      const [file] = await ctx.db
        .insert(filesTable)
        .values({
          id,
          name: input.filename,
          title: input.filename,
          memberId: membership.id,
          workspaceId: input.workspaceId,
          mimetype: input.mimetype,
          filetype: filetype,
          storageKey: key,
          size: input.size,
          status: 'uploading',
          prettyType,
        })
        .returning();
      if (!file) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR'});
      }

      const expires = 1000 * 60;

      const uploadURL = await getSignedUrl(
        r2,
        new PutObjectCommand({
          Bucket: env.R2_PRIMARY_STORAGE_BUCKET_NAME,
          Key: key,
          ContentType: input.mimetype,
        }),
      );

      return {
        ok: true,
        file: file.id,
        uploadURL,
        expires,
      };
    }),
  uploadComplete: baseProcedure
    .input(
      z.object({file: z.ksuid().nonempty(), workspaceId: z.ksuid().nonempty()}),
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
        throw new TRPCError({code: 'FORBIDDEN'});
      }

      const [file] = await ctx.db
        .update(filesTable)
        .set({status: 'ready'})
        .where(eq(filesTable.id, input.file))
        .returning();
      if (!file) {
        throw new TRPCError({code: 'INTERNAL_SERVER_ERROR'});
      }

      const fileURL = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: env.R2_PRIMARY_STORAGE_BUCKET_NAME,
          Key: file.storageKey,
        }),
      );

      return {
        ok: true,
        file: {
          id: file.id,
          name: file.name,
          title: file.title,
          mimetype: file.mimetype,
          filetype: file.filetype,
          prettyType: file.prettyType,
          size: file.size,
          fileURL,
          status: file.status,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        },
      };
    }),
});

function getFileType(mime: string) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'video/mp4') return 'mp4';
  if (mime === 'application/pdf') return 'pdf';
  return 'unkown';
}

function getFilePrettyType(type: string) {
  if (type === 'jpg') return 'JPEG';
  if (type === 'png') return 'PNG';
  if (type === 'pdf') return 'PDF';
  if (type === 'webp') return 'WEBP';
  if (type === 'mp4') return 'MPEG 4 Video';
  return 'UNKOWN';
}
