import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(sp.get('limit') ?? '20'));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: session.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
        },
      }),
      prisma.notification.count({ where: { recipientId: session.user.id } }),
      prisma.notification.count({ where: { recipientId: session.user.id, isRead: false } }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      hasMore: skip + notifications.length < total,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}