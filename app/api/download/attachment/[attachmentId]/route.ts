import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getS3Client } from '@/lib/r2/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    await requireAuth();
    const { attachmentId } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { fileUrl: true, fileName: true },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const signedUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: attachment.fileUrl,   // fileUrl stores the R2 object key
        ResponseContentDisposition: `attachment; filename="${attachment.fileName}"`,
      }),
      { expiresIn: 900 } // 15 minutes
    );

    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}