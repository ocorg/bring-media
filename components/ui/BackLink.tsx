'use client';

import { Link } from '@/lib/i18n/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackLinkProps {
  href: string;
  label: string;
}

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href as `/${string}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        color: 'var(--muted)',
        textDecoration: 'none',
        marginBottom: '1.5rem',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
    >
      <ChevronLeft size={15} />
      {label}
    </Link>
  );
}