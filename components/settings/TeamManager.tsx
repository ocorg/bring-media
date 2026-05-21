'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Plus, Mail, Trash2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
}

interface Props {
  initialMembers: Member[];
  initialInvites: PendingInvite[];
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'var(--brand)',
  manager: 'var(--warning)',
  team_member: 'var(--muted)',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  team_member: 'Team Member',
};

export default function TeamManager({ initialMembers, initialInvites }: Props) {
  const t = useTranslations('settings.team');
  const { toast } = useToast();
  const [members] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'team_member'>('team_member');
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    if (!email.trim()) { toast('Email is required', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Failed to send invite', 'error'); return; }
      toast(`Invitation sent to ${email}`, 'success');
      setModalOpen(false);
      setEmail('');
      setRole('team_member');
    } catch {
      toast('Network error', 'error');
    } finally {
      setSending(false);
    }
  }

  async function revokeInvite(id: string) {
    try {
      const res = await fetch(`/api/auth/invite/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast('Failed to revoke invitation', 'error'); return; }
      setInvites((prev) => prev.filter((inv) => inv.id !== id));
      toast('Invitation revoked', 'success');
    } catch {
      toast('Network error', 'error');
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>Team members</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} />
          Invite member
        </Button>
      </div>

      {/* Members list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <Avatar name={m.name} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{m.name}</p>
              <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.email}</p>
            </div>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: ROLE_COLORS[m.role] ?? 'var(--muted)',
                background: `${ROLE_COLORS[m.role] ?? '#6b7280'}14`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {ROLE_LABELS[m.role] ?? m.role}
            </span>
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {invites.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} color="var(--warning)" />
            Pending invitations ({invites.length})
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {invites.map((inv, i) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < invites.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={13} color="var(--muted)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: 'var(--text)' }}>{inv.email}</p>
                  <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Expires {new Date(inv.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '8px' }}>
                  {ROLE_LABELS[inv.role] ?? inv.role}
                </span>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', display: 'flex', opacity: 0.6, transition: 'opacity 150ms ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.6')}
                  title={t('revokeInvite')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('inviteTitle')} maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            They'll receive an email with a link to set their password. The link expires in 48 hours.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={sending} onClick={handleInvite}>
              <Mail size={13} />
              Send invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}