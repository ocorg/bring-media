import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { getS3Client } from './client';

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder: 'logos' | 'attachments',
  originalName: string
): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed.`);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 10 MB size limit.');
  }

  const ext = originalName.split('.').pop() ?? 'bin';
  const key = `${folder}/${randomUUID()}.${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    url: `${PUBLIC_URL}/${key}`,
    key,
  };
}

export async function deleteFile(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}