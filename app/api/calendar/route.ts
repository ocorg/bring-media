import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const sp = req.nextUrl.searchParams;
    const from = new Date(sp.get('from') ?? '');
    const to = new Date(sp.get('to') ?? '');

    if (isNaN(from.getTime()) || isNaN(to.getTime()))
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });

    const isManager =
      session.user.role === 'manager' || session.user.role === 'super_admin';

    const taskWhere = {
      dueDate: { gte: from, lte: to },
      ...(isManager ? {} : { assignedToId: session.user.id }),
    };

    const [tasks, projects] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.project.findMany({
        where: {
          startDate: { lte: to },
          endDate: { gte: from },
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          serviceType: { select: { color: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ tasks, projects });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}