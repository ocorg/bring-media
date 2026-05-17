'use client';

import { Link } from '@/lib/i18n/navigation';

interface Props {
  clientId: string;
  clientName: string;
  status: string;
  statusColor: string;
}

export default function ProjectDetailHeader({
  clientId,
  clientName,
  status,
  statusColor,
}: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Link
        href={`/clients/${clientId}` as `/${string}`}
        style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none', transition: 'color 150ms ease' }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)')
        }
      >
        {clientName}
      </Link>

      <span
        style={{
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: statusColor,
        }}
      >
        {status}
      </span>
    </div>
  );
}