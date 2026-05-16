'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t('error'));
      setLoading(false);
    } else {
      router.push(`/${locale}`);
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* Left — Brand panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        borderRight: '1px solid var(--border)',
      }}
        className="hidden-mobile"
      >
        <div>
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            BRING MEDIA
          </p>
        </div>

        <div>
          <p style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '16px',
          }}>
            Internal Operations
          </p>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 80px)',
            fontWeight: '500',
            color: 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            Terminal
          </h1>
          <div style={{
            width: '24px',
            height: '2px',
            background: 'var(--brand)',
            marginTop: '16px',
          }} />
        </div>

        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
          © {new Date().getFullYear()} BRING Media
        </p>
      </div>

      {/* Right — Form panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Mobile wordmark */}
          <div style={{ marginBottom: '2.5rem' }} className="show-mobile-only">
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--muted)', textTransform: 'uppercase' }}>
              BRING MEDIA
            </p>
            <p style={{ fontSize: '24px', fontWeight: '500', color: 'var(--text)' }}>
              Terminal
            </p>
          </div>

          <p style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '2rem',
          }}>
            {t('subtitle')}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}>
                {t('email')}
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}>
                {t('password')}
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--danger)',
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '11px',
                background: 'var(--brand)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 150ms ease, transform 150ms ease',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  {t('loading')}
                </>
              ) : t('submit')}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) {
          .show-mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}