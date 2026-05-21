'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Plus, Mail, Trash2, Clock, Pencil, Power, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  isHidden: boolean;
  isActive: boolean;
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
  currentUserId: string;
  currentUserRole: string;
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

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  transition: 'background 150ms ease, color 150ms ease, opacity 150ms ease',
};

export default function TeamManager({ initialMembers, initialInvites, currentUserId, currentUserRole }: Props) {
  const t = useTranslations('settings.team');
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);

  // ── Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'team_member'>('team_member');
  const [sending, setSending] = useState(false);

  // ── Edit modal state
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Per-row loading states (keyed by userId)
  const [togglingActive, setTogglingActive] = useState<Record<string, boolean>>({});
  const [togglingHidden, setTogglingHidden] = useState<Record<string, boolean>>({});

  // ── Permission helpers ─────────────────────────────────────────────────────
  function canEditMember(m: Member) {
    if (currentUserRole === 'super_admin') return true;
    if (currentUserRole === 'manager' && m.role === 'team_member') return true;
    return false;
  }

  function canToggleActive(m: Member) {
    if (m.id === currentUserId) return false; // cannot deactivate yourself
    return canEditMember(m);
  }

  function canToggleHidden(m: Member) {
    void m;
    return currentUserRole === 'super_admin';
  }

  // ── Invite ─────────────────────────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail.trim()) { toast('Email is required', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Failed to send invite', 'error'); return; }
      toast(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('team_member');
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

  // ── Toggle active ──────────────────────────────────────────────────────────
  async function handleToggleActive(m: Member) {
    setTogglingActive((prev) => ({ ...prev, [m.id]: true }));
    const newValue = !m.isActive;
    try {
      const res = await fetch(`/api/users/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newValue }),
      });
      if (!res.ok) { toast('Failed to update user', 'error'); return; }
      setMembers((prev) => prev.map((u) => u.id === m.id ? { ...u, isActive: newValue } : u));
      toast(newValue ? `${m.name} reactivated` : `${m.name} deactivated`, 'success');
    } catch {
      toast('Network error', 'error');
    } finally {
      setTogglingActive((prev) => ({ ...prev, [m.id]: false }));
    }
  }

  // ── Toggle hidden ──────────────────────────────────────────────────────────
  async function handleToggleHidden(m: Member) {
    setTogglingHidden((prev) => ({ ...prev, [m.id]: true }));
    const newValue = !m.isHidden;
    try {
      const res = await fetch(`/api/users/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: newValue }),
      });
      if (!res.ok) { toast('Failed to update user', 'error'); return; }
      setMembers((prev) => prev.map((u) => u.id === m.id ? { ...u, isHidden: newValue } : u));
      toast(newValue ? `${m.name} is now a ghost` : `${m.name} is now visible`, 'success');
    } catch {
      toast('Network error', 'error');
    } finally {
      setTogglingHidden((prev) => ({ ...prev, [m.id]: false }));
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function openEdit(m: Member) {
    setEditingMember(m);
    setEditName(m.name);
    setEditEmail(m.email);
  }

  async function handleEditSave() {
    if (!editingMember) return;
    if (!editName.trim()) { toast('Name is required', 'error'); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/users/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      if (!res.ok) { toast('Failed to save changes', 'error'); return; }
      setMembers((prev) => prev.map((u) =>
        u.id === editingMember.id
          ? { ...u, name: editName.trim(), email: editEmail.trim() }
          : u
      ));
      toast('Profile updated', 'success');
      setEditingMember(null);
    } catch {
      toast('Network error', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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
        <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
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
              opacity: m.isActive ? 1 : 0.5,
              transition: 'opacity 250ms ease',
            }}
          >
            <Avatar name={m.name} size={32} />

            {/* Name + email + status badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{m.name}</p>
                {!m.isActive && (
                  <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                    Inactive
                  </span>
                )}
                {m.isHidden && (
                  <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--brand)', background: 'rgba(143,0,255,0.1)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                    Ghost
                  </span>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.email}</p>
            </div>

            {/* Role badge */}
            <span style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: ROLE_COLORS[m.role] ?? 'var(--muted)',
              background: `${ROLE_COLORS[m.role] ?? '#6b7280'}14`,
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
            }}>
              {ROLE_LABELS[m.role] ?? m.role}
            </span>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>

              {/* Edit */}
              {canEditMember(m) && (
                <button
                  onClick={() => openEdit(m)}
                  title="Edit profile"
                  style={{ ...iconBtn, color: 'var(--muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  <Pencil size={13} />
                </button>
              )}

              {/* Toggle active / inactive */}
              {canToggleActive(m) && (
                <button
                  onClick={() => handleToggleActive(m)}
                  disabled={!!togglingActive[m.id]}
                  title={m.isActive ? 'Deactivate user' : 'Reactivate user'}
                  style={{
                    ...iconBtn,
                    color: m.isActive ? 'var(--success)' : 'var(--danger)',
                    opacity: togglingActive[m.id] ? 0.35 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <Power size={13} />
                </button>
              )}

              {/* Toggle hidden — super_admin only */}
              {canToggleHidden(m) && (
                <button
                  onClick={() => handleToggleHidden(m)}
                  disabled={!!togglingHidden[m.id]}
                  title={m.isHidden ? 'Make visible (remove ghost)' : 'Make ghost (hide from all lists)'}
                  style={{
                    ...iconBtn,
                    color: m.isHidden ? 'var(--brand)' : 'var(--muted)',
                    opacity: togglingHidden[m.id] ? 0.35 : 1,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  {m.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}

            </div>
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
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < invites.length - 1 ? '1px solid var(--border)' : 'none' }}>
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
                  style={{ ...iconBtn, color: 'var(--danger)', opacity: 0.6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                  title={t('revokeInvite')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite modal ─────────────────────────────────────────────────────── */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('inviteTitle')} maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}>
              <option value="team_member">Team Member</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>They'll receive an email with a link to set their password. The link expires in 48 hours.</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={sending} onClick={handleInvite}>
              <Mail size={13} />
              Send invitation
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit member modal ─────────────────────────────────────────────────── */}
      <Modal open={!!editingMember} onClose={() => setEditingMember(null)} title="Edit member" maxWidth="420px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button variant="primary" loading={savingEdit} onClick={handleEditSave}>Save changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}