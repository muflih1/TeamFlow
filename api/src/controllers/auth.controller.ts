import {and, eq} from 'drizzle-orm';
import {db} from '../db/index.js';
import {sessionsTable, usersTable} from '../db/schema.js';
import {createSession, getSetSessionCookieOptions} from '../lib/sessions.js';
import {asyncHandler} from '../utils/async-handler.js';
import bcrypt from 'bcryptjs';

export const createAccountHandler = asyncHandler(async (req, res) => {
  const {name, email, password} = req.body;

  const salt = await bcrypt.genSalt(12);
  const passwordDigest = await bcrypt.hash(password, salt);

  const [user] = await db
    .insert(usersTable)
    .values({name, email, passwordDigest})
    .returning();

  if (!user) {
    throw new Error('Inserting using failed this should not reachable.');
  }

  const session = await createSession(user.id, req.get('user-agent'), req.ip);

  return res
    .cookie('uid', user.id, getSetSessionCookieOptions())
    .cookie('sid', session.token, getSetSessionCookieOptions())
    .status(201)
    .json({user, session});
});

export const signInHandler = asyncHandler(async (req, res) => {
  const {email, password} = req.body;
  const user = await db.query.usersTable.findFirst({
    where: (fields, {eq}) => eq(fields.email, email),
  });
  const passwordDigest = user?.passwordDigest ?? '...';
  const macth = await bcrypt.compare(password, passwordDigest);
  if (!user || !macth) {
    return res.status(401).json({error_message: 'Invalid credentials'});
  }
  const session = await createSession(user.id, req.get('user-agent'), req.ip);

  return res
    .cookie('uid', user.id, getSetSessionCookieOptions())
    .cookie('sid', session.token, getSetSessionCookieOptions())
    .json({user, session});
});

export const meHandler = asyncHandler(async (req, res) => {
  if (!req.session?.userId) {
    return res.json(null);
  }

  const user = await db.query.usersTable.findFirst({
    where: (fields, {eq}) => eq(fields.id, req.session.userId),
    columns: {
      passwordDigest: false,
      emailVerificationAt: false,
    },
  });

  if (!user) return res.json(null);

  return res
    .cookie('test', 'deleted', {
      httpOnly: true,
      path: '/',
      maxAge: 1000 * 60 * 60,
    })
    .clearCookie('test', {path: '/', httpOnly: true})
    .status(200)
    .json({
      id: user.id,
      name: user.name,
      email: user.email,
      image:
        user.imageObjectKey !== null
          ? /** do a pregined url */ {uri: ''}
          : null,
      createdAt: user.createdAt,
    });
});

export const signOutHandler = asyncHandler(async (req, res) => {
  const session = req.session;

  if (!session) {
    return res.status(401).json({error_message: 'Unauthorize'});
  }

  const {id, userId, createdAt} = session;

  await db
    .delete(sessionsTable)
    .where(
      and(
        eq(sessionsTable.id, id),
        eq(sessionsTable.userId, userId),
        eq(sessionsTable.createdAt, createdAt),
      ),
    );

  return res
    .clearCookie('uid', getSetSessionCookieOptions())
    .clearCookie('sid', getSetSessionCookieOptions())
    .sendStatus(204);
});
