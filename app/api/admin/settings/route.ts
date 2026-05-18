import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    await auth();
    const key = req.nextUrl.searchParams.get('key');
    if (!key) {
      const all = await prisma.systemSetting.findMany();
      return NextResponse.json({ settings: Object.fromEntries(all.map((s: { key: string; value: string }) => [s.key, s.value])) });
    }
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return NextResponse.json({ value: setting?.value ?? null });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { key, value } = await req.json() as { key: string; value: string };
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}