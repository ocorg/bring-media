'use client';

import { useState, useRef, useEffect } from 'react';
import { updateClientHealth } from '@/lib/actions/clients';
import { useToast } from '@/lib/hooks/useToast';
import type { HealthStatus } from '@prisma/client';

const HEALTH_CONFIG = {
  healthy: { label: 'Healthy', color: 'var(--success)' },
  at_risk: { label: 'At Risk', color: 'var(--warning)' },
  critical: { label: 'Critical', color: 'var(--danger)' },
} as const;

interface HealthIndicatorProps {
  clientId: string;
  status: HealthStatus;
  canEdit: boolean;
}

export default function HealthIndicator({ clientId, status, canEdit }: HealthIndicatorProps) {
  const [current, setCurrent] = useState<HealthStatus>(status);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const config = HEALTH_CONFIG[current];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(newStatus: HealthStatus) {
    if (newStatus === current || loading) return;
    setLoading(true);
    setOpen(false);
    const result = await updateClientHealth(clientId, newStatus);
    if (result.success) {
      setCurrent(newStatus);
      toast('Health status updated', 'success');
    } else {
      toast(result.error, 'error');
    }
    setLoading(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => canEdit && setOpen(!open)}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: config.color,
          background: `color-mix(in srgb, ${config.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`,
          cursor: canEdit ? 'pointer' : 'default',
          transition: 'opacity 150ms ease',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {config.label}
        {canEdit && <span style={{ marginLeft: '4px', fontSize: '8px' }}>▾</span>}
      </button>

      {open && canEdit && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 100,
          minWidth: '120px',
        }}>
          {(Object.entries(HEALTH_CONFIG) as [HealthStatus, typeof HEALTH_CONFIG[HealthStatus]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 12px',
                background: key === current ? 'var(--surface-2)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: cfg.color,
                transition: 'background 150ms ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = key === current ? 'var(--surface-2)' : 'none'; }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: cfg.color,
                flexShrink: 0,
              }} />
              {cfg.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}