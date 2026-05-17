'use client';

import { Link } from '@/lib/i18n/navigation';

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  paused: 'var(--warning)',
  completed: 'var(--muted)',
  archived: 'var(--border)',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    client: { name: string };
    serviceType: { name: string; color: string };
    _count: { tasks: number };
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] ?? 'var(--muted)';

  return (
    <Link
      href={`/projects/${project.id}` as `/${string}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-2)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-hover)';
        (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = statusColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = statusColor;
      }}
    >
      {/* Service type badge + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        {/* Pattern B — service type */}
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: project.serviceType.color,
            background: `${project.serviceType.color}14`,
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {project.serviceType.name}
        </span>

        {/* Pattern B — status */}
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: statusColor,
          }}
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {/* Project name */}
      <p
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {project.name}
      </p>

      {/* Client name */}
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
        {project.client.name}
      </p>

      {/* Footer: task count + dates */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
        </span>
        {project.endDate && (
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Due{' '}
            {new Date(project.endDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </Link>
  );
}