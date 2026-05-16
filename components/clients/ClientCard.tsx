'use client';

import { Link } from '@/lib/i18n/navigation';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Building2 } from 'lucide-react';

const HEALTH_COLORS = {
  healthy: 'var(--success)',
  at_risk: 'var(--warning)',
  critical: 'var(--danger)',
} as const;

const HEALTH_LABELS = {
  healthy: 'Healthy',
  at_risk: 'At risk',
  critical: 'Critical',
} as const;

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    industry: string | null;
    logoUrl: string | null;
    healthStatus: 'healthy' | 'at_risk' | 'critical';
    _count: { projects: number };
  };
}

export default function ClientCard({ client }: ClientCardProps) {
  const healthColor = HEALTH_COLORS[client.healthStatus];

  return (
    <Link
      href={`/clients/${client.id}` as `/${string}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        borderLeft: `3px solid ${healthColor}`,
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.1rem 1.25rem',
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-hover)';
        (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = healthColor;
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = healthColor;
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {client.logoUrl ? (
          <img
            src={client.logoUrl}
            alt={client.name}
            width={36}
            height={36}
            style={{ borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Avatar name={client.name} size={36} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {client.name}
            </p>
            <Badge
              label={HEALTH_LABELS[client.healthStatus]}
              color={healthColor}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {client.industry && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={11} color="var(--muted)" />
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {client.industry}
                </span>
              </div>
            )}
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}