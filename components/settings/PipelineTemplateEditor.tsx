'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/lib/hooks/useToast';
import { savePipelineTemplate, type PipelineStage } from '@/lib/actions/serviceTypes';
import Button from '@/components/ui/Button';
import { Plus, Trash2, GripVertical, ShieldCheck } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ServiceType, PipelineTemplate } from '@prisma/client';

interface ServiceTypeWithTemplate extends ServiceType {
  pipelineTemplate: PipelineTemplate | null;
}

interface Props {
  serviceTypes: ServiceTypeWithTemplate[];
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableStageRow({
  stage,
  onNameChange,
  onApprovalToggle,
  onDelete,
}: {
  stage: PipelineStage;
  onNameChange: (id: string, name: string) => void;
  onApprovalToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: isDragging ? 'var(--surface-2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '6px',
      }}
    >
      {/* Grip */}
      <button
        {...listeners}
        {...attributes}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'grab',
          padding: '2px',
          display: 'flex',
          flexShrink: 0,
          touchAction: 'none',
        }}
      >
        <GripVertical size={14} />
      </button>

      {/* Order badge */}
      <span
        style={{
          fontSize: '11px',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
          width: '18px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {stage.order + 1}
      </span>

      {/* Name input */}
      <input
        value={stage.name}
        onChange={(e) => onNameChange(stage.id, e.target.value)}
        placeholder="Stage name"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          borderRadius: 0,
          color: 'var(--text)',
          fontSize: '13px',
          padding: '4px 0',
          outline: 'none',
          width: '100%',
        }}
      />

      {/* Approval toggle */}
      <button
        onClick={() => onApprovalToggle(stage.id)}
        title="Requires approval"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: stage.requiresApproval ? 'var(--brand)' : 'var(--border)',
          padding: '2px',
          display: 'flex',
          flexShrink: 0,
          transition: 'color 150ms ease',
        }}
      >
        <ShieldCheck size={15} />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(stage.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          flexShrink: 0,
          opacity: 0.6,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.6')}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function PipelineTemplateEditor({ serviceTypes }: Props) {
  const t = useTranslations('settings.pipeline');
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState<string>('');
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function loadTemplate(serviceTypeId: string) {
    setSelectedId(serviceTypeId);
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    const existing = (st?.pipelineTemplate?.stages ?? []) as unknown as PipelineStage[];
    setStages(existing.length > 0 ? existing : []);
  }

  function addStage() {
    setStages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        order: prev.length,
        requiresApproval: false,
      },
    ]);
  }

  function handleNameChange(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function handleApprovalToggle(id: string) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, requiresApproval: !s.requiresApproval } : s
      )
    );
  }

  function handleDelete(id: string) {
    setStages((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({
        ...s,
        order: i,
      }));
    });
  }

  async function handleSave() {
    if (!selectedId) return;
    setLoading(true);
    const res = await savePipelineTemplate(selectedId, stages);
    setLoading(false);
    if (!res.success) return toast(res.error, 'error');
    toast('Pipeline template saved', 'success');
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>
          {t('title')}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Warning banner */}
      <div
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderLeft: '3px solid var(--warning)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--warning)',
          marginBottom: '1.5rem',
        }}
      >
        {t('warningBanner')}
      </div>

      {/* Service type select */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Service type
        </label>
        <select
          value={selectedId}
          onChange={(e) => loadTemplate(e.target.value)}
          style={{ maxWidth: '320px' }}
        >
          <option value="">— Select service type —</option>
          {serviceTypes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      {/* Editor */}
      {selectedId && (
        <>
          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '10px',
              padding: '0 14px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)', flex: 1, paddingLeft: '46px' }}>
              {t('stageName')}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={11} />
              {t('requiresApproval')}
            </span>
          </div>

          {/* dnd-kit list */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {stages.map((stage) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  onNameChange={handleNameChange}
                  onApprovalToggle={handleApprovalToggle}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {stages.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '13px',
                padding: '2rem',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No stages yet — add your first one.
            </p>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '1rem',
            }}
          >
            <Button variant="ghost" size="sm" onClick={addStage}>
              <Plus size={13} />
              {t('addStage')}
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleSave}
            >
              {t('save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}