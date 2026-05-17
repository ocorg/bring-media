'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/lib/hooks/useToast';
import { updateTask, deleteTask } from '@/lib/actions/tasks';
import TaskStatusStepper from './TaskStatusStepper';
import TimeLogger from './TimeLogger';
import AttachmentZone from './AttachmentZone';
import CommentThread from './CommentThread';
import Avatar from '@/components/ui/Avatar';
import { X, Trash2, Pencil } from 'lucide-react';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface TeamMember {
  id: string;
  name: string;
}

interface FullTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  project: { id: string; pipelineSnapshot: unknown };
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; name: string; avatarUrl: string | null };
  }>;
  timeLogs: Array<{
    id: string;
    hours: number;
    note: string | null;
    loggedAt: Date;
    user: { id: string; name: string };
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
}

interface Props {
  taskId: string | null;
  onClose: () => void;
  onDeleted: (taskId: string) => void;
  teamMembers: TeamMember[];
  userRole: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  marginBottom: '8px',
};

const DIVIDER: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: '18px',
  marginTop: '18px',
};

export default function TaskDrawer({
  taskId,
  onClose,
  onDeleted,
  teamMembers,
  userRole,
}: Props) {
  const { toast } = useToast();
  const [task, setTask] = useState<FullTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  // Inline edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchTask = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (data.task) {
        setTask(data.task);
        setCurrentUserId(data.currentUserId);
      }
    } catch {
      toast('Failed to load task', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (taskId) fetchTask(taskId);
    else setTask(null);
  }, [taskId, fetchTask]);

  async function saveTitle() {
    if (!task || !titleDraft.trim() || titleDraft === task.title) {
      setEditingTitle(false);
      return;
    }
    const res = await updateTask(task.id, { title: titleDraft.trim() });
    if (!res.success) { toast(res.error, 'error'); return; }
    setTask((t) => t ? { ...t, title: titleDraft.trim() } : t);
    setEditingTitle(false);
    toast('Title updated', 'success');
  }

  async function saveDesc() {
    if (!task) { setEditingDesc(false); return; }
    const res = await updateTask(task.id, { description: descDraft.trim() || undefined });
    if (!res.success) { toast(res.error, 'error'); return; }
    setTask((t) => t ? { ...t, description: descDraft.trim() || null } : t);
    setEditingDesc(false);
    toast('Description updated', 'success');
  }

  async function handlePriorityChange(priority: string) {
    if (!task) return;
    const res = await updateTask(task.id, { priority: priority as never });
    if (!res.success) { toast(res.error, 'error'); return; }
    setTask((t) => t ? { ...t, priority } : t);
  }

  async function handleAssigneeChange(assigneeId: string) {
    if (!task) return;
    const res = await updateTask(task.id, { assigneeId: assigneeId || null });
    if (!res.success) { toast(res.error, 'error'); return; }
    const member = teamMembers.find((m) => m.id === assigneeId) ?? null;
    setTask((t) =>
      t ? { ...t, assignee: member ? { id: member.id, name: member.name, avatarUrl: null } : null } : t
    );
  }

  async function handleDueDateChange(dueDate: string) {
    if (!task) return;
    const res = await updateTask(task.id, { dueDate: dueDate || null });
    if (!res.success) { toast(res.error, 'error'); return; }
    setTask((t) => t ? { ...t, dueDate: dueDate ? new Date(dueDate) : null } : t);
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    const res = await deleteTask(task.id);
    setDeleting(false);
    if (!res.success) { toast(res.error, 'error'); return; }
    toast('Task deleted', 'success');
    onDeleted(task.id);
    onClose();
  }

  const stages = task
    ? (task.project.pipelineSnapshot as unknown as PipelineStage[])
    : [];

  const isManager = userRole === 'manager' || userRole === 'super_admin';

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 500,
            }}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '520px',
              maxWidth: '100vw',
              zIndex: 501,
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {loading || !task ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {loading ? 'Loading...' : 'No task selected'}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingTitle ? (
                      <input
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle();
                          if (e.key === 'Escape') setEditingTitle(false);
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          fontSize: '17px',
                          fontWeight: '500',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--brand)',
                          color: 'var(--text)',
                          padding: '2px 0',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'text',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: '100%',
                        }}
                      >
                        <span style={{ fontSize: '17px', fontWeight: '500', color: 'var(--text)', lineHeight: 1.4 }}>
                          {task.title}
                        </span>
                        <Pencil size={12} color="var(--muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {isManager && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          padding: '6px',
                          display: 'flex',
                          borderRadius: 'var(--radius-sm)',
                          opacity: deleting ? 0.5 : 0.7,
                          transition: 'opacity 150ms ease',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = deleting ? '0.5' : '0.7')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        padding: '6px',
                        display: 'flex',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

                  {/* Stage stepper */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={SECTION_LABEL}>Pipeline</p>
                    <TaskStatusStepper
                      taskId={task.id}
                      currentStatus={task.status}
                      stages={stages}
                      userRole={userRole}
                      onStatusChanged={(newStatus) =>
                        setTask((t) => t ? { ...t, status: newStatus } : t)
                      }
                    />
                  </div>

                  {/* Meta row */}
                  <div
                    style={{
                      ...DIVIDER,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '14px',
                    }}
                  >
                    {/* Priority */}
                    <div>
                      <p style={SECTION_LABEL}>Priority</p>
                      <select
                        value={task.priority}
                        onChange={(e) => handlePriorityChange(e.target.value)}
                        style={{
                          width: '100%',
                          color: PRIORITY_COLORS[task.priority] ?? 'var(--muted)',
                        }}
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <p style={SECTION_LABEL}>Assignee</p>
                      <select
                        value={task.assignee?.id ?? ''}
                        onChange={(e) => handleAssigneeChange(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Due date */}
                    <div>
                      <p style={SECTION_LABEL}>Due date</p>
                      <input
                        type="date"
                        value={
                          task.dueDate
                            ? new Date(task.dueDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) => handleDueDateChange(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={DIVIDER}>
                    <p style={SECTION_LABEL}>Description</p>
                    {editingDesc ? (
                      <div>
                        <textarea
                          value={descDraft}
                          onChange={(e) => setDescDraft(e.target.value)}
                          rows={4}
                          autoFocus
                          style={{ width: '100%', fontSize: '13px', resize: 'vertical', marginBottom: '6px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingDesc(false);
                          }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={saveDesc}
                            style={{ fontSize: '12px', color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDesc(false)}
                            style={{ fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setDescDraft(task.description ?? ''); setEditingDesc(true); }}
                        style={{
                          background: task.description ? 'transparent' : 'var(--surface-2)',
                          border: '1px dashed var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: task.description ? '0' : '12px',
                          cursor: 'text',
                          textAlign: 'left',
                          width: '100%',
                          display: 'block',
                        }}
                      >
                        <p style={{ fontSize: '13px', color: task.description ? 'var(--text)' : 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {task.description ?? 'Add a description...'}
                        </p>
                      </button>
                    )}
                  </div>

                  {/* Time tracking */}
                  <div style={DIVIDER}>
                    <p style={SECTION_LABEL}>Time tracking</p>
                    <TimeLogger
                      taskId={task.id}
                      estimatedHours={task.estimatedHours}
                      actualHours={task.actualHours}
                      timeLogs={task.timeLogs}
                      onLogged={(newActual, newLog) =>
                        setTask((t) =>
                          t
                            ? {
                                ...t,
                                actualHours: newActual,
                                timeLogs: [newLog, ...t.timeLogs],
                              }
                            : t
                        )
                      }
                    />
                  </div>

                  {/* Attachments */}
                  <div style={DIVIDER}>
                    <p style={SECTION_LABEL}>Attachments</p>
                    <AttachmentZone
                      taskId={task.id}
                      attachments={task.attachments}
                      onUploaded={(att) =>
                        setTask((t) =>
                          t ? { ...t, attachments: [att, ...t.attachments] } : t
                        )
                      }
                    />
                  </div>

                  {/* Comments */}
                  <div style={DIVIDER}>
                    <p style={SECTION_LABEL}>
                      Comments ({task.comments.length})
                    </p>
                    <CommentThread
                      taskId={task.id}
                      comments={task.comments}
                      currentUserId={currentUserId}
                      currentUserRole={userRole}
                      onCommentsChange={(comments) =>
                        setTask((t) => t ? { ...t, comments } : t)
                      }
                    />
                  </div>

                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}