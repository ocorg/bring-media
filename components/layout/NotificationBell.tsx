'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const [unreadCount] = useState(0);

  return (
    <button
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        color: 'var(--muted)',
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
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
        (e.currentTarget as HTMLButtonElement).style.background = 'none';
      }}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'var(--brand)',
          color: 'white',
          fontSize: '9px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}