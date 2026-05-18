'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Calendar,
  Users,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import type { Role } from '@prisma/client';
import Avatar from '@/components/ui/Avatar';

interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/', icon: <LayoutDashboard size={16} />, roles: ['super_admin', 'manager', 'team_member'] },
  { key: 'clients', href: '/clients', icon: <Building2 size={16} />, roles: ['super_admin', 'manager'] },
  { key: 'projects', href: '/projects', icon: <FolderKanban size={16} />, roles: ['super_admin', 'manager'] },
  { key: 'calendar', href: '/calendar', icon: <Calendar size={16} />, roles: ['super_admin', 'manager'] },
  { key: 'workload', href: '/workload', icon: <Users size={16} />, roles: ['super_admin', 'manager'] },
  { key: 'notifications', href: '/notifications', icon: <Bell size={16} />, roles: ['super_admin', 'manager', 'team_member'] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { key: 'settings', href: '/settings', icon: <Settings size={16} />, roles: ['super_admin', 'manager', 'team_member'] },
  { key: 'admin', href: '/admin', icon: <Shield size={16} />, roles: ['super_admin'] },
];

export default function Sidebar({ user, locale }: { user: SidebarUser; locale: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const visibleBottom = BOTTOM_ITEMS.filter((item) => item.roles.includes(user.role));

  function isActive(href: string) {
    if (href === '/') return /^\/[a-z]{2}$/.test(pathname) || pathname === '/';
    return pathname.includes(href);
  }

  const sidebarContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      width: collapsed ? '64px' : '220px',
      transition: 'width 200ms ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase' }}>
              BRING MEDIA
            </p>
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', lineHeight: 1.2 }}>
              Terminal
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href as `/${string}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '8px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: active ? '500' : '400',
                color: active ? 'var(--text)' : 'var(--muted)',
                background: active ? 'var(--surface-2)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                marginBottom: '2px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{t(item.key as any)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {visibleBottom.map((item) => (
          <Link
            key={item.key}
            href={item.href as `/${string}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px 0' : '8px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--muted)',
              background: isActive(item.href) ? 'var(--surface-2)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
              marginBottom: '2px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{t(item.key as any)}</span>}
          </Link>
        ))}

        {/* User row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: collapsed ? '10px 0' : '8px 10px',
          marginTop: '4px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Avatar name={user.name} imageUrl={user.image} size={26} />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </p>
              <p style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role.replace('_', ' ')}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div style={{ display: 'flex' }} className="desktop-sidebar">
        {sidebarContent}
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed',
          top: '12px',
          left: '12px',
          zIndex: 900,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
        }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 950 }}>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
          />
          <div style={{ position: 'relative', height: '100%', width: '220px' }}>
            {sidebarContent}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @media (min-width: 641px) { .mobile-menu-btn { display: none !important; } }
        @media (max-width: 640px) { .desktop-sidebar { display: none !important; } }
      `}</style>
    </>
  );
}