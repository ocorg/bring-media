'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { getPusherClient } from '@/lib/pusher/client';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications';
import { Bell, CheckCheck, BellRing, ArrowRight, MessageSquare } from 'lucide-react';

interface RawNotification {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
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

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'task_assigned') return <BellRing size={13} color="var(--brand)" />;
  if (type === 'status_changed') return <ArrowRight size={13} color="var(--success)" />;
  if (type === 'comment_added') return <MessageSquare size={13} color="var(--warning)" />;
  return <Bell size={13} color="var(--muted)" />;
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<RawNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    fetch('/api/notifications?limit=10')
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {/* silent */});
  }, []);

  // Pusher subscription
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);

    channel.bind('notification.new', (data: RawNotification) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [data, ...prev].slice(0, 10));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${userId}`);
    };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleNotificationClick(n: RawNotification) {
    // Mark as read (optimistic)
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id);
    }
    setOpen(false);
    const projectId = n.payload.projectId ?? n.task?.project?.id;
    if (projectId) router.push(`/projects/${projectId}` as `/${string}`);
    else router.push('/notifications');
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: open ? 'var(--bg)' : 'none',
          border: 'none',
          color: open ? 'var(--text)' : 'var(--muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: 'var(--radius-md)',
          transition: 'color 150ms ease, background 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              background: 'var(--brand)',
              color: 'white',
              fontSize: '9px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            zIndex: 600,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '10px',
                    background: 'rgba(143,0,255,0.15)',
                    color: 'var(--brand)',
                    padding: '1px 6px',
                    borderRadius: '8px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color 150ms ease',
                  opacity: markingAll ? 0.5 : 1,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)')
                }
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '13px',
                  padding: '2rem',
                }}
              >
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    background: n.isRead ? 'transparent' : 'rgba(143,0,255,0.05)',
                    borderBottom: '1px solid var(--border)',
                    border: 'none',
                    borderBottomColor: 'var(--border)',
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      'var(--surface-2)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = n.isRead
                      ? 'transparent'
                      : 'rgba(143,0,255,0.05)')
                  }
                >
                  {/* Type icon */}
                  <div style={{ flexShrink: 0, paddingTop: '1px' }}>
                    <TypeIcon type={n.type} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: n.isRead ? '400' : '500',
                        color: 'var(--text)',
                        marginBottom: '2px',
                      }}
                    >
                      {n.payload.title}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {n.payload.body}
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--border)', marginTop: '3px' }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--brand)',
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
            }}
          >
            <button
              onClick={() => { setOpen(false); router.push('/notifications'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)')
              }
            >
              View all notifications
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}