import {S3Client} from '@aws-sdk/client-s3';
import {env} from './env.js';
import {S3RequestPresigner} from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const signer = new S3RequestPresigner({
  ...r2.config,
});
