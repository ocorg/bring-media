'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Search, Settings, LogOut } from 'lucide-react';
import type { Role } from '@prisma/client';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from './NotificationBell';
import { Link } from '@/lib/i18n/navigation';

interface TopbarUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
}

export default function Topbar({ user }: { user: TopbarUser }) {
  const t = useTranslations();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      flexShrink: 0,
    }}>
      {/* Search trigger */}
      <button
        onClick={() => document.dispatchEvent(new Event('bring:search:open'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: '13px',
          transition: 'border-color 150ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
      >
        <Search size={14} />
        <span>{t('common.search')}</span>
        <kbd style={{
          fontSize: '10px',
          padding: '1px 5px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          color: 'var(--muted)',
          fontFamily: 'inherit',
          marginLeft: '16px',
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NotificationBell userId={user.id} />

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <Avatar name={user.name} imageUrl={user.image} size={28} />
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>
              {user.name.split(' ')[0]}
            </span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              minWidth: '200px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 500,
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{user.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{user.email}</p>
              </div>
              <Link
                href="/settings/profile"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
              >
                <Settings size={14} />
                {t('settings.profile.title')}
              </Link>
              <button
                onClick={() => signOut()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: 'var(--muted)',
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; }}
              >
                <LogOut size={14} />
                {t('nav.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}