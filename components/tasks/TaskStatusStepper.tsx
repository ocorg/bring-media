'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface Props {
  taskId: string;
  currentStatus: string;
  stages: PipelineStage[];
  userRole: string;
  onStatusChanged: (newStatus: string) => void;
}

export default function TaskStatusStepper({
  taskId,
  currentStatus,
  stages,
  userRole,
  onStatusChanged,
}: Props) {
  const { toast } = useToast();
  const [advancing, setAdvancing] = useState(false);
  const [backing, setBacking] = useState(false);

  const currentIndex = stages.findIndex((s) => s.name === currentStatus);
  const currentStage = stages[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === stages.length - 1;
  const isManager = userRole === 'manager' || userRole === 'super_admin';
  const needsApproval = currentStage?.requiresApproval && !isManager;
  const showAdvance = !isLast && !needsApproval;

  async function handleAdvance() {
    setAdvancing(true);
    const res = await updateTaskStatus(taskId, 'advance');
    setAdvancing(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    onStatusChanged(res.data!.newStatus);
    toast('Stage advanced', 'success');
  }

  async function handleBack() {
    setBacking(true);
    const res = await updateTaskStatus(taskId, 'back');
    setBacking(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    onStatusChanged(res.data!.newStatus);
    toast('Stage moved back', 'info');
  }

  return (
    <div>
      {/* Stage dots row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', overflowX: 'auto' }}>
        {stages.map((stage, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: isCurrent
                    ? 'rgba(143,0,255,0.15)'
                    : isDone
                    ? 'rgba(34,197,94,0.1)'
                    : 'transparent',
                  border: `1px solid ${isCurrent ? 'var(--brand)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.04em',
                    color: isCurrent ? 'var(--brand)' : isDone ? 'var(--success)' : 'var(--muted)',
                    fontWeight: isCurrent ? '600' : '400',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stage.name}
                </span>
                {stage.requiresApproval && (
                  <ShieldCheck
                    size={9}
                    color={isCurrent ? 'var(--brand)' : isDone ? 'var(--success)' : 'var(--border)'}
                  />
                )}
              </div>
              {i < stages.length - 1 && (
                <div style={{ width: '12px', height: '1px', background: 'var(--border)', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!isFirst && (
          <button
            onClick={handleBack}
            disabled={backing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)',
              fontSize: '12px',
              padding: '5px 10px',
              cursor: 'pointer',
              opacity: backing ? 0.5 : 1,
              transition: 'all 150ms ease',
            }}
          >
            <ChevronLeft size={12} />
            Back
          </button>
        )}

        {showAdvance && (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: currentStage?.requiresApproval
                ? 'rgba(143,0,255,0.1)'
                : 'none',
              border: `1px solid ${currentStage?.requiresApproval ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              color: currentStage?.requiresApproval ? 'var(--brand)' : 'var(--muted)',
              fontSize: '12px',
              padding: '5px 10px',
              cursor: 'pointer',
              opacity: advancing ? 0.5 : 1,
              transition: 'all 150ms ease',
            }}
          >
            {currentStage?.requiresApproval ? (
              <>
                <ShieldCheck size={12} />
                Approve & Advance
              </>
            ) : (
              <>
                Advance
                <ChevronRight size={12} />
              </>
            )}
          </button>
        )}

        {/* Team member blocked by approval gate */}
        {!isLast && needsApproval && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--muted)',
              padding: '5px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ShieldCheck size={11} color="var(--warning)" />
            Awaiting manager approval
          </div>
        )}
      </div>
    </div>
  );
}