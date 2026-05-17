'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { logTime } from '@/lib/actions/tasks';
import Button from '@/components/ui/Button';
import { Clock } from 'lucide-react';

interface TimeLogEntry {
  id: string;
  hours: number;
  note: string | null;
  loggedAt: Date;
  user: { id: string; name: string };
}

interface Props {
  taskId: string;
  estimatedHours: number | null;
  actualHours: number | null;
  timeLogs: TimeLogEntry[];
  onLogged: (newActual: number, newLog: TimeLogEntry) => void;
}

export default function TimeLogger({
  taskId,
  estimatedHours,
  actualHours,
  timeLogs,
  onLogged,
}: Props) {
  const { toast } = useToast();
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit() {
    const h = parseFloat(hours);
    if (!h || h <= 0) {
      toast('Enter valid hours', 'error');
      return;
    }
    setLoading(true);
    const res = await logTime(taskId, h, note.trim() || undefined);
    setLoading(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    const newActual = (actualHours ?? 0) + h;
    onLogged(newActual, {
      id: crypto.randomUUID(),
      hours: h,
      note: note.trim() || null,
      loggedAt: new Date(),
      user: { id: '', name: 'You' },
    });
    toast(`${h}h logged`, 'success');
    setHours('');
    setNote('');
    setShowForm(false);
  }

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '10px',
        }}
      >
        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '2px' }}>
            Estimated
          </p>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            {estimatedHours != null ? `${estimatedHours}h` : '—'}
          </p>
        </div>

        {/* Pattern C underline bar */}
        <div style={{ flex: 1 }}>
          {estimatedHours != null && (
            <div
              style={{
                height: '3px',
                background: 'var(--border)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '14px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(((actualHours ?? 0) / estimatedHours) * 100, 100)}%`,
                  background:
                    (actualHours ?? 0) > estimatedHours
                      ? 'var(--danger)'
                      : 'var(--brand)',
                  transition: 'width 400ms ease',
                }}
              />
            </div>
          )}
        </div>

        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '2px' }}>
            Logged
          </p>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>
            {actualHours != null ? `${actualHours}h` : '0h'}
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: 'var(--brand)',
            background: 'rgba(143,0,255,0.08)',
            border: '1px solid rgba(143,0,255,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <Clock size={12} />
          Log time
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '0 0 100px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                Hours
              </label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 1.5"
                min={0.25}
                max={24}
                step={0.25}
                style={{ width: '100%' }}
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                Note
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you work on?"
                style={{ width: '100%' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Log history */}
      {timeLogs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {timeLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text)', fontWeight: '500', flexShrink: 0 }}>
                {log.hours}h
              </span>
              <span style={{ color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.note || '—'}
              </span>
              <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: '11px' }}>
                {log.user.name}
              </span>
              <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: '11px' }}>
                {new Date(log.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}