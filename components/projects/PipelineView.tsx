'use client';

import { ShieldCheck } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedHours: number | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { comments: number; attachments: number };
}

interface PipelineViewProps {
  stages: PipelineStage[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export default function PipelineView({ stages, tasks, onTaskClick }: PipelineViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}
    >
      {stages.map((stage) => {
        const stageTasks = tasks.filter((t) => t.status === stage.name);
        return (
          <div
            key={stage.id}
            style={{
              minWidth: '240px',
              width: '240px',
              flexShrink: 0,
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                padding: '0 2px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  flex: 1,
                }}
              >
                {stage.name}
              </span>
              {stage.requiresApproval && (
                <span title="Requires approval" style={{ display: 'flex' }}>
                  <ShieldCheck size={12} color="var(--brand)" />
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  background: 'var(--surface-2)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {stageTasks.length}
              </span>
            </div>

            {/* Task cards */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                minHeight: '120px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {stageTasks.length === 0 ? (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--border)',
                    textAlign: 'center',
                    margin: 'auto',
                    paddingTop: '24px',
                  }}
                >
                  Empty
                </p>
              ) : (
                stageTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={onTaskClick} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}