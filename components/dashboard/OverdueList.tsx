import { Link } from '@/lib/i18n/navigation';
import { AlertTriangle } from 'lucide-react';

interface OverdueTask {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: string;
  project: { id: string; name: string };
  assignedTo: { name: string } | null;
}

interface Props {
  tasks: OverdueTask[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

function daysOverdue(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export default function OverdueList({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '1rem 0' }}>
        No overdue tasks 🎉
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/projects/${task.project.id}` as `/${string}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] ?? 'var(--muted)'}`,
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            transition: 'background 150ms ease',
          }}
        >
          <AlertTriangle size={13} color="var(--danger)" style={{ flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {task.project.name}
              {task.assignedTo && ` · ${task.assignedTo.name}`}
            </p>
          </div>

          {task.dueDate && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--danger)',
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {daysOverdue(task.dueDate)}d overdue
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}