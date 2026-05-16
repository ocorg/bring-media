import { S3Client } from '@aws-sdk/client-s3';

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (_client) return _client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      `Missing R2 env vars — accountId:${!!accountId} accessKeyId:${!!accessKeyId} secretKey:${!!secretAccessKey}`
    );
  }

  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _client;
}