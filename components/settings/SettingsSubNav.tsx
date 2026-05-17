'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';

interface Tab {
  label: string;
  href: string;
}

const ALL_TABS: (Tab & { managerOnly?: boolean })[] = [
  { label: 'Profile', href: '/settings/profile' },
  { label: 'Service types', href: '/settings/service-types', managerOnly: true },
  { label: 'Pipeline templates', href: '/settings/pipeline-templates', managerOnly: true },
  { label: 'Bundle templates', href: '/settings/bundle-templates', managerOnly: true },
  { label: 'Team', href: '/settings/team', managerOnly: true },
];

export default function SettingsSubNav({
  canManageTemplates,
}: {
  canManageTemplates: boolean;
}) {
  const pathname = usePathname();

  const tabs = ALL_TABS.filter((t) => !t.managerOnly || canManageTemplates);

  return (
    <div>
      <h1
        style={{
          fontSize: '22px',
          fontWeight: '500',
          color: 'var(--text)',
          marginBottom: '1.25rem',
        }}
      >
        Settings
      </h1>
      <div
        style={{
          display: 'flex',
          gap: '2px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0',
        }}
      >
        {tabs.map((tab) => {
          const active = pathname.includes(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href as `/${string}`}
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                color: active ? 'var(--text)' : 'var(--muted)',
                borderBottom: active
                  ? '2px solid var(--brand)'
                  : '2px solid transparent',
                textDecoration: 'none',
                transition: 'color 150ms ease',
                fontWeight: active ? '500' : '400',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}