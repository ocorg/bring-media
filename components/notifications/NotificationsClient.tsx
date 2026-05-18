'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';
import Button from '@/components/ui/Button';
import {
  BellRing,
  ArrowRight,
  MessageSquare,
  Bell,
  CheckCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  payload: {
    title: string;
    body: string;
    projectId?: string;
    actorName?: string;
  };
  task?: {
    id: string;
    title: string;
    project: { id: string; name: string };
  } | null;
}

interface Props {
  initialNotifications: NotificationItem[];
  initialTotal: number;
  initialUnread: number;
  pageSize: number;
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'task_assigned') return <BellRing size={15} color="var(--brand)" />;
  if (type === 'status_changed') return <ArrowRight size={15} color="var(--success)" />;
  if (type === 'comment_added') return <MessageSquare size={15} color="var(--warning)" />;
  return <Bell size={15} color="var(--muted)" />;
}

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsClient({
  initialNotifications,
  initialTotal,
  initialUnread,
  pageSize,
}: Props) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unread, setUnread] = useState(initialUnread);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const hasMore = notifications.length < total;

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/notifications?page=${nextPage}&limit=${pageSize}`);
    const data = await res.json();
    setNotifications((prev) => [...prev, ...(data.notifications ?? [])]);
    setTotal(data.total ?? total);
    setPage(nextPage);
    setLoadingMore(false);
  }

  async function handleClick(n: NotificationItem) {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnread((c) => Math.max(0, c - 1));
      markNotificationRead(n.id);
    }
    const projectId = n.payload.projectId ?? n.task?.project?.id;
    if (projectId) router.push(`/projects/${projectId}` as `/${string}`);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setMarkingAll(false);
  }

  return (
    <div>
      {/* Toolbar */}
      {unread > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <Button
            variant="secondary"
            size="sm"
            loading={markingAll}
            onClick={handleMarkAll}
          >
            <CheckCheck size={13} />
            Mark all read
          </Button>
        </div>
      )}

      {/* List */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '3rem' }}>
            No notifications yet.
          </p>
        ) : (
          notifications.map((n, i) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                width: '100%',
                padding: '14px 16px',
                background: n.isRead ? 'transparent' : 'rgba(143,0,255,0.04)',
                border: 'none',
                borderBottom:
                  i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: n.payload.projectId || n.task ? 'pointer' : 'default',
                textAlign: 'left',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (n.payload.projectId || n.task)
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = n.isRead
                  ? 'transparent'
                  : 'rgba(143,0,255,0.04)';
              }}
            >
              {/* Icon */}
              <div style={{ flexShrink: 0, paddingTop: '2px', width: '24px', display: 'flex', justifyContent: 'center' }}>
                <TypeIcon type={n.type} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: n.isRead ? '400' : '500',
                    color: 'var(--text)',
                    marginBottom: '2px',
                  }}
                >
                  {n.payload.title}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {n.payload.body}
                </p>
                {n.task && (
                  <p style={{ fontSize: '11px', color: 'var(--border)', marginTop: '4px' }}>
                    {n.task.project.name}
                  </p>
                )}
              </div>

              {/* Right column */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {timeAgo(n.createdAt)}
                </span>
                {!n.isRead && (
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                    }}
                  />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <Button variant="secondary" loading={loadingMore} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}