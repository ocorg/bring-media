'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import Button from '@/components/ui/Button';
import { Shield, Mail, AlertTriangle } from 'lucide-react';

interface Props {
  initialMaintenanceMode: boolean;
  adminEmail: string;
}

export default function AdminClient({ initialMaintenanceMode, adminEmail }: Props) {
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState(initialMaintenanceMode);
  const [toggling, setToggling] = useState(false);
  const [testEmail, setTestEmail] = useState(adminEmail);
  const [sendingTest, setSendingTest] = useState(false);

  async function toggleMaintenance() {
    setToggling(true);
    const newValue = !maintenance;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenance_mode', value: String(newValue) }),
      });
      if (!res.ok) { toast('Failed to update', 'error'); return; }
      setMaintenance(newValue);
      toast(newValue ? 'Maintenance mode ON' : 'Maintenance mode OFF', 'success');
    } catch {
      toast('Network error', 'error');
    } finally {
      setToggling(false);
    }
  }

  async function sendTestEmail() {
    if (!testEmail) { toast('Enter an email address', 'error'); return; }
    setSendingTest(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Failed to send', 'error'); return; }
      toast(`Test email sent to ${testEmail}`, 'success');
    } catch {
      toast('Network error', 'error');
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '560px' }}>

      {/* Maintenance mode */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${maintenance ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: maintenance ? 'rgba(245,158,11,0.1)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} color={maintenance ? 'var(--warning)' : 'var(--muted)'} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
              Maintenance mode
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Shows a maintenance banner to all users when enabled. Super admins can still access everything.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={toggleMaintenance}
                disabled={toggling}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: maintenance ? 'var(--warning)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 200ms ease',
                  opacity: toggling ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: maintenance ? '23px' : '3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 200ms ease',
                }} />
              </button>
              <span style={{ fontSize: '12px', color: maintenance ? 'var(--warning)' : 'var(--muted)', fontWeight: maintenance ? '500' : '400' }}>
                {maintenance ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Email test */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={16} color="var(--muted)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
              Test email delivery
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
              Sends a test email to verify your SMTP configuration is working.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                style={{ flex: 1 }}
              />
              <Button variant="secondary" size="sm" loading={sendingTest} onClick={sendTestEmail}>
                Send test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Shield size={14} color="var(--brand)" />
          <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>System</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            ['Environment', process.env.NODE_ENV ?? 'unknown'],
            ['App URL', process.env.NEXT_PUBLIC_APP_URL ?? '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: 'var(--muted)', width: '120px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}