import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import NotificationsClient from '@/components/notifications/NotificationsClient';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const PAGE_SIZE = 20;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.notification.count({ where: { recipientId: session.user.id } }),
    prisma.notification.count({ where: { recipientId: session.user.id, isRead: false } }),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
          Notifications
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {total} total · {unreadCount} unread
        </p>
      </div>

      <NotificationsClient
    initialNotifications={notifications.map((n) => ({
      ...n,
      payload: n.payload as {
        title: string;
        body: string;
        projectId?: string;
        actorName?: string;
      },
    }))}
        initialTotal={total}
        initialUnread={unreadCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}