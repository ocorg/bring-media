'use client';

import { ShieldCheck } from 'lucide-react';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface PipelineViewProps {
  stages: PipelineStage[];
  tasks: Task[];
}

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

export default function PipelineView({ stages, tasks }: PipelineViewProps) {
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
                stageTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${PRIORITY_BORDER[task.priority] ?? 'var(--muted)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text)',
                        lineHeight: 1.4,
                      }}
                    >
                      {task.title}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}