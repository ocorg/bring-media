'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { useTranslations } from 'next-intl';
import { updateTask } from '@/lib/actions/tasks';
import WorkloadChart from '@/components/dashboard/WorkloadChart';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

interface MemberTask {
  id: string;
  title: string;
  priority: string;
  status: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  tasks: MemberTask[];
}

interface Props {
  members: Member[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#8f00ff',
  low: '#6b7280',
};

export default function WorkloadClient({ members }: Props) {
  const { toast } = useToast();
  const t = useTranslations('workload');
  const tc = useTranslations('common');
  const [reassigning, setReassigning] = useState<{ taskId: string; taskTitle: string; fromName: string } | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  const chartData = members.map((m) => ({
    name: m.name.split(' ')[0],
    urgent: m.tasks.filter((t) => t.priority === 'urgent').length,
    high: m.tasks.filter((t) => t.priority === 'high').length,
    normal: m.tasks.filter((t) => t.priority === 'normal').length,
    low: m.tasks.filter((t) => t.priority === 'low').length,
  }));

  async function handleReassign() {
    if (!reassigning || !newAssigneeId) return;
    setSaving(true);
    const res = await updateTask(reassigning.taskId, { assigneeId: newAssigneeId });
    setSaving(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    toast('Task reassigned', 'success');
    setReassigning(null);
    setNewAssigneeId('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Chart */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '1rem' }}>
          Task distribution by priority
        </p>
        <WorkloadChart data={chartData} />
      </div>

      {/* Member rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {members.map((member) => (
          <div
            key={member.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Member header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderBottom: member.tasks.length > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <Avatar name={member.name} size={32} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{member.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>{member.role.replace('_', ' ')}</p>
              </div>
              {/* Priority counts */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['urgent', 'high', 'normal', 'low'] as const).map((p) => {
                  const count = member.tasks.filter((t) => t.priority === p).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={p}
                      style={{
                        fontSize: '10px',
                        letterSpacing: '0.06em',
                        color: PRIORITY_COLORS[p],
                        background: `${PRIORITY_COLORS[p]}14`,
                        padding: '2px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {count} {p}
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--muted)', marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>
                {member.tasks.length} tasks
              </span>
            </div>

            {/* Task rows */}
            {member.tasks.slice(0, 5).map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 16px',
                  borderBottom: i < Math.min(member.tasks.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg)',
                }}
              >
                <div
                  style={{
                    width: '3px',
                    height: '20px',
                    borderRadius: '2px',
                    background: PRIORITY_COLORS[task.priority] ?? 'var(--muted)',
                    flexShrink: 0,
                  }}
                />
                <p style={{ flex: 1, fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </p>
                <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {task.status}
                </span>
                <button
                  onClick={() => {
                    setReassigning({ taskId: task.id, taskTitle: task.title, fromName: member.name });
                    setNewAssigneeId('');
                  }}
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                >
                  Reassign
                </button>
              </div>
            ))}

            {member.tasks.length > 5 && (
              <p style={{ fontSize: '11px', color: 'var(--muted)', padding: '8px 16px', background: 'var(--bg)' }}>
                +{member.tasks.length - 5} more tasks
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Reassign modal */}
      <Modal
        open={!!reassigning}
        onClose={() => setReassigning(null)}
        title={t('reassignTask')}
        maxWidth="400px"
      >
        {reassigning && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Moving <strong style={{ color: 'var(--text)' }}>{reassigning.taskTitle}</strong> from {reassigning.fromName}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                New assignee
              </label>
              <select value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)}>
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setReassigning(null)}>{tc('cancel')}</Button>
              <Button variant="primary" loading={saving} onClick={handleReassign}>
                {t('reassign')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}