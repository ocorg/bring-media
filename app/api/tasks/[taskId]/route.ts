import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await requireAuth();
    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, pipelineSnapshot: true },
        },
        assignee: {
          select: { id: true, name: true, avatarUrl: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        timeLogs: {
          orderBy: { loggedDate: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const normalized = {
      ...task,
      estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : null,
      actualHours: task.actualHours ? Number(task.actualHours) : null,
      assignee: (task as any).assignedTo ?? null,
      timeLogs: task.timeLogs.map((l) => ({
        ...l,
        hours: Number(l.hours),
        loggedAt: l.loggedDate,
      })),
    };
    return NextResponse.json({ task: normalized, currentUserId: session.user.id, currentUserRole: session.user.role });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}