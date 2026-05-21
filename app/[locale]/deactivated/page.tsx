'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { ShieldOff } from 'lucide-react';

export default function DeactivatedPage() {
  useEffect(() => {
    // Clear the session silently — user stays on this page
    signOut({ redirect: false });
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '440px', width: '100%' }}>

        {/* Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}
        >
          <ShieldOff size={30} color="var(--danger)" />
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--danger)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '1.25rem',
          }}
        >
          Access restricted
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: '500',
            color: 'var(--text)',
            marginBottom: '0.75rem',
            lineHeight: '1.25',
            letterSpacing: '-0.02em',
          }}
        >
          Account Deactivated
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--muted)',
            lineHeight: '1.65',
            marginBottom: '2rem',
          }}
        >
          Your account has been deactivated and you no longer have access to this platform.
        </p>

        {/* Divider */}
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'var(--border)',
            margin: '0 auto 1.5rem',
          }}
        />

        {/* Contact note */}
        <p style={{ fontSize: '12px', color: 'var(--muted)', opacity: 0.65 }}>
          Please contact your manager to restore access.
        </p>

      </div>
    </div>
  );
}