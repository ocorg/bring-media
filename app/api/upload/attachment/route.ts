import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getS3Client } from '@/lib/r2/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const taskId = formData.get('taskId') as string | null;

    if (!file || !taskId) {
      return Response.json({ error: 'file and taskId are required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ error: `File type "${file.type}" is not allowed` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const key = `attachments/${taskId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: key,       // stores the R2 object key
        uploaderId: session.user.id,
      },
    });

    return Response.json({ attachment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload/attachment]', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}