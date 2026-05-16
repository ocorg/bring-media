import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const steps: string[] = [];

  try {
    steps.push('1:start');

    const { auth } = await import('@/lib/auth/auth');
    steps.push('2:auth-imported');

    const session = await auth();
    steps.push(`3:session=${!!session?.user} role=${session?.user?.role ?? 'none'}`);

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized', steps }, { status: 401 });
    }

    steps.push('4:parsing-form');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    steps.push(`5:file=${file?.type ?? 'none'} size=${file?.size ?? 0}`);

    if (!file) {
      return Response.json({ error: 'No file provided', steps }, { status: 400 });
    }

    steps.push('6:importing-r2');
    const { uploadFile } = await import('@/lib/r2/upload');
    steps.push('7:r2-imported');

    const buffer = Buffer.from(await file.arrayBuffer());
    steps.push('8:buffer-ready');

    const result = await uploadFile(buffer, file.type, 'logos', file.name);
    steps.push(`9:uploaded url=${result.url}`);

    return Response.json({ url: result.url, key: result.key, steps });
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error('[upload/logo] FAILED at steps:', steps, '| error:', msg);
    return Response.json({ error: msg, steps }, { status: 500 });
  }
}