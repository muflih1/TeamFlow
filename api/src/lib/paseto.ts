import * as V4 from 'paseto-ts/v4';
import {env} from './env.js';

const key = env.SOCKET_AUTH_PASETO_LOCAL_TOKEN_KEY;

export function signToken(payload: Record<string, any>) {
  return V4.encrypt(key, payload);
}

export function verifyToken<T extends {[key: string]: any}>(token: string) {
  try {
    const {payload} = V4.decrypt<T>(key, token);
    return payload;
  } catch (error) {
    console.log({error})
    throw new Error('Invaid or expired token');
  }
}
