import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {requestContextHandler} from './utils/request-response.js';
import {deserializeSession} from './lib/sessions.js';
import apiRouter from './routes/index.js';
import http from 'node:http';
import {Server} from 'socket.io';
import {verifyToken} from './lib/paseto.js';
import { env } from './lib/env.js';

const app = express();

app
  .use(express.json())
  .use(express.urlencoded({extended: true}))
  .use(helmet({crossOriginResourcePolicy: {policy: 'cross-origin'}}))
  .use(cors({origin: env.WWW_URL, credentials: true}))
  .use(cookieParser())
  .use(requestContextHandler)
  .use(deserializeSession);

app.use('/api', apiRouter);

export const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: env.WWW_URL,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const payload = verifyToken<{sub: string; sid: string; ua: string}>(token);
    const userId = payload.sub;
    const [sessionId, createdAt] = payload.sid.split(':') as [string, string];
    const userAgent = payload.ua;
    if (userAgent !== socket.handshake.headers['user-agent']) {
      return next(new Error('Forbidden'));
    }
    socket.session = {
      id: parseInt(sessionId),
      userId,
      createdAt: parseInt(createdAt),
    };
    next();
  } catch (error) {
    console.log({error}, 'socket io erro');
    next(new Error('Unauthorized'));
  }
});

io.on('connection', socket => {
  console.log('user connected:', socket.id);

  socket.on('workspace_request_subscribe', ({id}) => {
    socket.join(id);
  });

  socket.on('workspace_request_unsubscribe', ({id}) => {
    socket.leave(id)
  })

  socket.on('disconnect', reason => {
    console.log('DISCONNECTED:', reason);
  });
});

declare module 'socket.io' {
  interface Socket {
    session: {
      id: number;
      userId: string;
      createdAt: number;
    };
  }
}
