import {getAxios} from '@/lib/axios';
import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {z} from 'zod';

export const getCurrentUser = createServerFn({method: 'GET'}).handler(
  async ({context}) => {
    return context.currentUser;
  },
);

export const signIn = createServerFn({method: 'POST'})
  .inputValidator(
    z.object({email: z.email().nonempty(), password: z.string().min(1)}),
  )
  .handler(async ({data}) => {
    const response = await fetch(`${process.env.SERVER_URL}/api/auth/sign-in`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    const cookies = response.headers.getSetCookie();
    if (cookies) {
      for (const cookie of cookies) {
        setResponseHeader('Set-Cookie', cookie);
      }
    }
    return await response.json();
  });

export const signUp = createServerFn({method: 'POST'})
  .inputValidator(
    z.object({
      name: z.string().min(1),
      email: z.email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({data}) => {
    const response = await fetch(`${process.env.SERVER_URL}/api/auth/sign-up`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    const cookies = response.headers.getSetCookie();
    if (cookies) {
      for (const cookie of cookies) {
        setResponseHeader('Set-Cookie', cookie);
      }
    }
    return await response.json();
  });
