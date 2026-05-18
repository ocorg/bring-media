'use client';

import { useEffect, useState } from 'react';

interface Props {
  label: string;
  value: number | string;
  subtitle?: string;
  accent: string;
  fillPercent?: number;
  icon?: React.ReactNode;
}

export default function KpiCard({ label, value, subtitle, accent, fillPercent, icon }: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(fillPercent ?? 0), 80);
    return () => clearTimeout(t);
  }, [fillPercent]);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </p>
        {icon && <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>}
      </div>

      {/* Value */}
      <p style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>

      {subtitle && (
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{subtitle}</p>
      )}

      {/* Pattern C: animated underline fill bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--border)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            background: accent,
            transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}