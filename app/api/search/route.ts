import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return NextResponse.json({ clients: [], projects: [], tasks: [] });

    const contains = { contains: q, mode: 'insensitive' as const };

    const [clients, projects, tasks] = await Promise.all([
      prisma.client.findMany({
        where: { OR: [{ name: contains }, { industry: contains }] },
        select: { id: true, name: true, industry: true, logoUrl: true, healthStatus: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),
      prisma.project.findMany({
        where: { OR: [{ name: contains }, { description: contains }] },
        select: {
          id: true,
          name: true,
          status: true,
          serviceType: { select: { name: true, color: true } },
          client: { select: { name: true } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { OR: [{ title: contains }, { description: contains }] },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          project: { select: { id: true, name: true } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ clients, projects, tasks });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}