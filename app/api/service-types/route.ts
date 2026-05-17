import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireAuth();
    const serviceTypes = await prisma.serviceType.findMany({
      where: { isActive: true },
      include: {
        pipelineTemplate: true,
        bundleTemplate: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ serviceTypes });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}