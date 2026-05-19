'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);

  const [valid, setValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/invite/validate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEmail(data.email);
          setValid(true);
        } else {
        setValid(false);
      }
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return; }
      setDone(true);
      setTimeout(() => router.push('/login?invited=true'), 2000);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (valid === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d14' }}>
        <Loader2 size={24} color="#8f00ff" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Invalid token
  if (!valid) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d14', padding: '1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>⏰</p>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#f0f0f8', marginBottom: '8px' }}>
            Link expired or invalid
          </h1>
          <p style={{ fontSize: '14px', color: '#8b87a8', marginBottom: '24px' }}>
            Invite links expire after 48 hours. Ask your manager to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // Success
  if (done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d14', padding: '1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>✅</p>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#f0f0f8', marginBottom: '8px' }}>
            Account activated!
          </h1>
          <p style={{ fontSize: '14px', color: '#8b87a8' }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d0d14', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8f00ff', marginBottom: '8px' }}>
            BRING MEDIA
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: '500', color: '#f0f0f8', marginBottom: '8px' }}>
            Set your password
          </h1>
          <p style={{ fontSize: '14px', color: '#8b87a8' }}>
            Welcome! Setting up account for <strong style={{ color: '#f0f0f8' }}>{email}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b87a8', marginBottom: '6px' }}>
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoFocus
              required
              style={{ width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '12px 14px', color: '#f0f0f8', fontSize: '14px', outline: 'none' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b87a8', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                style={{ width: '100%', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '12px 44px 12px 14px', color: '#f0f0f8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8b87a8', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--danger)', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? '#5a0099' : '#8f00ff', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
          >
            {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Activating account...' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  );
}