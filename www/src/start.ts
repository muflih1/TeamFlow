import {createMiddleware, createStart} from '@tanstack/react-start';

const authMiddleware = createMiddleware().server(async ({next, request}) => {
  const response = await fetch(`${process.env.SERVER_URL}/api/auth/me`, {
    headers: request.headers,
  });
  const currentUser = (await response.json()) as null | {
    id: string;
    name: string;
    email: string;
    image: {uri: string} | null;
    createdAt: string;
  };

  const result = await next({
    context: {
      currentUser,
    },
  });

  if (response.headers) {
    response.headers.forEach((value, key) => {
      if (new Set(['set-cookie']).has(key.toLowerCase())) {
        result.response.headers.append(key, value);
      }
    });
  }

  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [authMiddleware],
}));
