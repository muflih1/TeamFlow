import {z} from 'zod';

const schema = z.object({
  PORT: z.string().min(2),
  DATABASE_URL: z.url(),
  WWW_URL: z.url(),
  R2_ACCESS_KEY_ID: z.string().nonempty(),
  R2_SECRET_ACCESS_KEY: z.string().nonempty(),
  R2_ENDPOINT: z.url(),
  R2_PRIMARY_STORAGE_BUCKET_NAME: z.string().nonempty(),
  SOCKET_AUTH_PASETO_LOCAL_TOKEN_KEY: z.string().min(32),
});

type Env = z.infer<typeof schema>;

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:', result.error.issues);
  process.exit(1);
}

export const env = result.data;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
