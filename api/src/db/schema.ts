import crypto from 'node:crypto';
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  customType,
  inet,
  uniqueIndex,
  char,
  index,
  AnyPgColumn,
  bigint,
  primaryKey,
  smallint,
} from 'drizzle-orm/pg-core';

class KSUID {
  constructor(
    private epoch = Math.floor(
      new Date('2014-05-13T00:00:00Z').getTime() / 1000,
    ),
  ) {}

  private encode(bytes: Uint8Array) {
    const charset =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    let value = 0n;

    for (const b of bytes) {
      value = (value << 8n) | BigInt(b);
    }

    let result = '';

    while (value > 0n) {
      const rem = Number(value % 62n);
      result = charset[rem] + result;
      value /= 62n;
    }

    return result.padStart(27, '0');
  }

  generate() {
    const now = Math.floor(Date.now() / 1000);

    const timestamp = now - this.epoch;

    if (timestamp < 0) {
      throw new Error('Time before epoch');
    }

    const bytes = new Uint8Array(20);

    // write timestamp (big-endian)
    bytes[0] = (timestamp >>> 24) & 0xff;
    bytes[1] = (timestamp >>> 16) & 0xff;
    bytes[2] = (timestamp >>> 8) & 0xff;
    bytes[3] = timestamp & 0xff;

    // 16 random bytes
    const rand = crypto.randomBytes(16);
    bytes.set(rand, 4);

    return this.encode(bytes);
  }
}

const ksuid = new KSUID();

export const bytea = customType<{data: Uint8Array}>({
  dataType() {
    return 'bytea';
  },
});

export const usersTable = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$default(() => ksuid.generate()),
  name: varchar('name', {length: 80}).notNull(),
  email: varchar('email', {length: 254}).notNull().unique(),
  emailVerificationAt: timestamp('email_verification_at', {withTimezone: true}),
  passwordDigest: varchar('password_digest', {length: 255}),
  imageObjectKey: text('image_object_key'),
  createdAt: timestamp('created_at', {withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sessionsTable = pgTable(
  'sessions',
  {
    id: smallint('id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    secretHash: bytea('secret_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: inet('ip_address'),
    revokedAt: timestamp('revoked_at', {withTimezone: true}),
    lastActiveAt: timestamp('last_active_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    lastRotatedAt: timestamp('last_rotated_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    createdAt: integer('created_at')
      .notNull()
      .$default(() => Math.floor(Date.now() / 1000)),
  },
  t => [primaryKey({columns: [t.id, t.userId, t.createdAt]})],
);

export const workspacesTable = pgTable('workspaces', {
  id: text('id')
    .primaryKey()
    .$default(() => ksuid.generate()),
  name: varchar('name', {length: 30}).notNull(),
  joinCode: char('join_code', {length: 6}).notNull().unique(),
  createdAt: timestamp('created_at', {withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const workspaceMembershipsTable = pgTable(
  'workspace_memberships',
  {
    id: text('id')
      .primaryKey()
      .$default(() => ksuid.generate()),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, {onDelete: 'cascade'}),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, {onDelete: 'cascade'}),
    role: text('role', {enum: ['org:owner', 'org:admin', 'org:member']})
      .notNull()
      .default('org:member'),
    createdAt: timestamp('created_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [uniqueIndex().on(t.userId, t.workspaceId), index().on(t.workspaceId)],
);

export const channelsTable = pgTable(
  'channels',
  {
    id: text('id')
      .primaryKey()
      .$default(() => ksuid.generate()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, {onDelete: 'cascade'}),
    name: varchar('name', {length: 80}).notNull(),
    createdAt: timestamp('created_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [index().on(t.workspaceId)],
);

export const filesTable = pgTable('files', {
  id: text('id')
    .primaryKey()
    .$default(() => ksuid.generate()),
  storageKey: text('storage_key').notNull(),
  memberId: text('member_id')
    .notNull()
    .references(() => workspaceMembershipsTable.id, {onDelete: 'cascade'}),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspacesTable.id, {onDelete: 'cascade'}),
  name: text('name').notNull(),
  title: text('title').notNull(),
  size: bigint('size', {mode: 'number'}).notNull(),
  mimetype: text('mimetype').notNull(),
  filetype: text('filetype').notNull(),
  prettyType: text('pretty_type'),
  status: text('status', {
    enum: ['uploading', 'uploaded', 'processing', 'ready', 'failed'],
  })
    .notNull()
    .default('uploading'),
  createdAt: timestamp('created_at', {withTimezone: true})
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const conversationsTable = pgTable(
  'conversations',
  {
    id: text('id')
      .primaryKey()
      .$default(() => ksuid.generate()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, {onDelete: 'cascade'}),
    memberOneId: text('member_one_id')
      .notNull()
      .references(() => workspaceMembershipsTable.id, {onDelete: 'cascade'}),
    memberTwoId: text('member_two_id')
      .notNull()
      .references(() => workspaceMembershipsTable.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [index().on(t.workspaceId)],
);

export const messagesTable = pgTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$default(() => ksuid.generate()),
    body: text('body').notNull(),
    memberId: text('member_id')
      .notNull()
      .references(() => workspaceMembershipsTable.id, {onDelete: 'cascade'}),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, {onDelete: 'cascade'}),
    channelId: text('channel_id').references(() => channelsTable.id, {
      onDelete: 'cascade',
    }),
    imageId: text('image_id').references(() => filesTable.id),
    parentMessageId: text('parent_message_id').references(
      (): AnyPgColumn => messagesTable.id,
      {onDelete: 'cascade'},
    ),
    conversationId: text('conversation_id').references(
      () => conversationsTable.id,
      {onDelete: 'cascade'},
    ),
    createdAt: timestamp('created_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [
    index().on(t.workspaceId),
    index().on(t.memberId),
    index().on(t.channelId),
    index().on(t.conversationId),
    index().on(t.channelId, t.parentMessageId),
    index().on(t.parentMessageId),
  ],
);

export const reactionsTable = pgTable(
  'reactions',
  {
    id: text('id')
      .primaryKey()
      .$default(() => ksuid.generate()),
    value: text('value').notNull(),
    memberId: text('member_id')
      .notNull()
      .references(() => workspaceMembershipsTable.id, {onDelete: 'cascade'}),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, {onDelete: 'cascade'}),
    messageId: text('message_id')
      .notNull()
      .references(() => messagesTable.id, {onDelete: 'cascade'}),
    createdAt: timestamp('created_at', {withTimezone: true})
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  t => [
    index().on(t.workspaceId),
    index().on(t.messageId),
    index().on(t.memberId),
  ],
);
