'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { createTask } from '@/lib/actions/tasks';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface TeamMember {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  serviceTypeId: string;
  stages: PipelineStage[];
  teamMembers: TeamMember[];
}

export default function NewTaskModal({
  open,
  onClose,
  projectId,
  serviceTypeId,
  stages,
  teamMembers,
}: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(stages[0]?.name ?? '');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');
  const [assigneeId, setAssigneeId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle('');
    setDescription('');
    setStatus(stages[0]?.name ?? '');
    setPriority('normal');
    setAssigneeId('');
    setEstimatedHours('');
    setDueDate('');
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast('Title is required', 'error');
      return;
    }
    setLoading(true);
    const res = await createTask({
      projectId,
      serviceTypeId,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      dueDate: dueDate || undefined,
    });
    setLoading(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    toast('Task created', 'success');
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New task" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Stage
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {stages.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Priority
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Assignee
            </label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Estimated hours"
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g. 3.5"
            min={0}
            step={0.5}
          />
        </div>

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Create task
          </Button>
        </div>
      </div>
    </Modal>
  );
}