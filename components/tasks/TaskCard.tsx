'use client';

import { MessageSquare, Paperclip, Clock } from 'lucide-react';

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    estimatedHours: number | null;
    assignee: { id: string; name: string; avatarUrl: string | null } | null;
    _count: { comments: number; attachments: number };
  };
  onClick: (taskId: string) => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const borderColor = PRIORITY_BORDER[task.priority] ?? 'var(--muted)';
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <button
      onClick={() => onClick(task.id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface-2)',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        padding: '10px 10px 8px',
        cursor: 'pointer',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(143,0,255,0.06)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)')
      }
    >
      {/* Title */}
      <p
        style={{
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text)',
          lineHeight: 1.4,
          marginBottom: '8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {task.title}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Priority badge — Pattern B */}
        <span
          style={{
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: borderColor,
            background: `${borderColor}14`,
            padding: '1px 5px',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        >
          {task.priority}
        </span>

        <div style={{ flex: 1 }} />

        {/* Due date */}
        {task.dueDate && (
          <span
            style={{
              fontSize: '10px',
              color: isOverdue ? 'var(--danger)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Clock size={9} />
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}

        {/* Counts */}
        {task._count.comments > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <MessageSquare size={9} />
            {task._count.comments}
          </span>
        )}
        {task._count.attachments > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Paperclip size={9} />
            {task._count.attachments}
          </span>
        )}

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            title={task.assignee.name}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--brand-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: '#fff',
              fontWeight: '600',
              flexShrink: 0,
            }}
          >
            {initials(task.assignee.name)}
          </div>
        )}
      </div>
    </button>
  );
}