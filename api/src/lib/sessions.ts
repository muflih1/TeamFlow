import {and, eq, sql} from 'drizzle-orm';
import {db} from '../db/index.js';
import {sessionsTable, usersTable} from '../db/schema.js';
import crypto from 'node:crypto';
import {sqids} from './sqids.js';
import {setCookie} from '../utils/request-response.js';
import {asyncHandler} from '../utils/async-handler.js';
import type {SerializeOptions} from 'cookie';

const inactivityTimeoutSeconds = 60 * 60 * 24 * 10;
const activityCheckIntervalSeconds = 60 * 60 * 24 * 1;

function generateSecureRandomString(): string {
  return 'Ac' + crypto.randomBytes(24).toString('base64url').slice(0, 42);
}

async function getSessionId(userId: string) {
  let a = false;
  let id = crypto.randomInt(1, 50);

  do {
    let [check] = await db
      .select({1: sql<number>`1`})
      .from(sessionsTable)
      .where(and(eq(sessionsTable.id, id)));
    if (check != null) {
      a = true;
      id += 1;
    } else {
      a = false;
    }
  } while (a);

  return id;
}

async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
) {
  const now = new Date();

  const id = await getSessionId(userId);
  const secret = generateSecureRandomString();
  const secretHash = await hashSecret(secret);
  const createdAt = Math.floor(now.getTime() / 1000);

  const token = `${id}:${sqids.encode([createdAt])}:${secret}`;

  const session = {
    id,
    userId,
    secretHash,
    userAgent,
    ipAddress,
    createdAt,
    token,
  };

  await db.insert(sessionsTable).values(session);

  return session;
}

async function hashSecret(secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
  return new Uint8Array(secretHashBuffer);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.byteLength; i++) {
    c |= a[i]! ^ b[i]!;
  }
  return c === 0;
}

async function getSession(
  sessionId: number,
  userId: string,
  createdAt: number,
) {
  const now = new Date();

  const [session] = await db
    .select({
      id: sessionsTable.id,
      userId: usersTable.id,
      secretHash: sessionsTable.secretHash,
      lastRotatedAt: sessionsTable.lastRotatedAt,
      createdAt: sessionsTable.createdAt,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(
      and(
        eq(sessionsTable.id, sessionId),
        eq(sessionsTable.userId, userId),
        eq(sessionsTable.createdAt, createdAt),
      ),
    );
  if (!session) {
    return null;
  }

  if (
    now.getTime() - session.lastRotatedAt.getTime() >=
    inactivityTimeoutSeconds * 1000
  ) {
    await db
      .delete(sessionsTable)
      .where(
        and(
          eq(sessionsTable.id, sessionId),
          eq(sessionsTable.userId, userId),
          eq(sessionsTable.createdAt, createdAt),
        ),
      );
    return null;
  }

  return session;
}

async function validateSessionToken(token: string, userId: string) {
  const now = new Date();

  const tokenParts = token.split(':') as [string, string, string];
  if (tokenParts.length !== 3) {
    return null;
  }
  const sessionId = parseInt(tokenParts[0]);
  const [sessionCreatedAt] = sqids.decode(tokenParts[1]);
  const sessionSecret = tokenParts[2];

  if (sessionCreatedAt == null) {
    return null;
  }

  const session = await getSession(sessionId, userId, sessionCreatedAt);
  if (!session) {
    return null;
  }

  const tokenSecretHash = await hashSecret(sessionSecret);
  const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
  if (!validSecret) {
    return null;
  }

  if (
    now.getTime() - session.lastRotatedAt.getTime() >=
    activityCheckIntervalSeconds * 1000
  ) {
    const newSecret = generateSecureRandomString();
    const newSecretHash = await hashSecret(newSecret);

    await db
      .update(sessionsTable)
      .set({secretHash: newSecretHash, lastRotatedAt: now})
      .where(
        and(
          eq(sessionsTable.id, sessionId),
          eq(sessionsTable.userId, userId),
          eq(sessionsTable.createdAt, sessionCreatedAt),
        ),
      );

    session.secretHash = newSecretHash;
    session.lastRotatedAt = now;

    const newToken = `${session.id}:${sqids.encode([session.createdAt])}:${newSecret}`;
    setCookie('sid', newToken, getSetSessionCookieOptions());
    setCookie('uid', userId, getSetSessionCookieOptions());
  }

  return session;
}

function getSetSessionCookieOptions(): SerializeOptions {
  return {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
}

const deserializeSession = asyncHandler(async (req, res, next) => {
  const sessionToken = req.cookies.sid;
  const userId = req.cookies.uid;

  if (sessionToken == null || userId == null) {
    return next();
  }

  const session = await validateSessionToken(sessionToken, userId);
  if (!session) return next();

  req.session = {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
  };

  return next();
});

export {deserializeSession, createSession, getSetSessionCookieOptions};

declare global {
  namespace Express {
    interface Request {
      session: {
        id: number;
        userId: string;
        createdAt: number;
      };
    }
  }
}
