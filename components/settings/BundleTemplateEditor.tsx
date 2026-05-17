'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/lib/hooks/useToast';
import { saveBundleTemplate, type BundleTask } from '@/lib/actions/serviceTypes';
import Button from '@/components/ui/Button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
import type { ServiceType, BundleTemplate } from '@prisma/client';

interface ServiceTypeWithTemplate extends ServiceType {
  bundleTemplate: BundleTemplate | null;
}

interface Props {
  serviceTypes: ServiceTypeWithTemplate[];
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  normal: 'var(--muted)',
  low: 'var(--border)',
};

function SortableTaskRow({
  task,
  onChange,
  onDelete,
}: {
  task: BundleTask;
  onChange: (id: string, patch: Partial<BundleTask>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        marginBottom: '8px',
      }}
    >
      {/* Top row: grip + title + priority + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
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

        <input
          value={task.title}
          onChange={(e) => onChange(task.id, { title: e.target.value })}
          placeholder="Task title"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            borderRadius: 0,
            color: 'var(--text)',
            fontSize: '13px',
            fontWeight: '500',
            padding: '4px 0',
            outline: 'none',
          }}
        />

        <select
          value={task.defaultPriority}
          onChange={(e) =>
            onChange(task.id, {
              defaultPriority: e.target.value as BundleTask['defaultPriority'],
            })
          }
          style={{
            width: '90px',
            fontSize: '11px',
            padding: '4px 8px',
            color: PRIORITY_COLORS[task.defaultPriority] ?? 'var(--muted)',
          }}
        >
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <input
          type="number"
          value={task.estimatedHours ?? ''}
          onChange={(e) =>
            onChange(task.id, {
              estimatedHours: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          placeholder="h"
          style={{ width: '54px', fontSize: '12px', textAlign: 'center' }}
          min={0}
          step={0.5}
        />

        <button
          onClick={() => onDelete(task.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            opacity: 0.6,
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.6')}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Description */}
      <textarea
        value={task.description}
        onChange={(e) => onChange(task.id, { description: e.target.value })}
        placeholder="Description (optional)"
        rows={2}
        style={{
          width: '100%',
          fontSize: '12px',
          color: 'var(--muted)',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          borderRadius: 0,
          resize: 'none',
          outline: 'none',
          padding: '4px 0',
          marginLeft: '24px',
        }}
      />
    </div>
  );
}

export default function BundleTemplateEditor({ serviceTypes }: Props) {
  const t = useTranslations('settings.bundle');
  const { toast } = useToast();

  const [selectedId, setSelectedId] = useState('');
  const [tasks, setTasks] = useState<BundleTask[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function loadTemplate(serviceTypeId: string) {
    setSelectedId(serviceTypeId);
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    const existing = (st?.bundleTemplate?.tasks ?? []) as unknown as BundleTask[];
    setTasks(existing);
  }

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        estimatedHours: null,
        defaultPriority: 'normal',
        order: prev.length,
      },
    ]);
  }

  function handleChange(id: string, patch: Partial<BundleTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function handleDelete(id: string) {
    setTasks((prev) =>
      prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i }))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((t, i) => ({
        ...t,
        order: i,
      }));
    });
  }

  async function handleSave() {
    if (!selectedId) return;
    setLoading(true);
    const res = await saveBundleTemplate(selectedId, tasks);
    setLoading(false);
    if (!res.success) return toast(res.error, 'error');
    toast('Bundle template saved', 'success');
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>
          {t('title')}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
          {t('subtitle')}
        </p>
      </div>

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

      {selectedId && (
        <>
          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '0 14px',
              marginBottom: '6px',
              paddingLeft: '38px',
            }}
          >
            <span style={{ flex: 1, fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('taskTitle')}
            </span>
            <span style={{ width: '90px', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Priority
            </span>
            <span style={{ width: '54px', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('estimatedHours')}
            </span>
            <span style={{ width: '22px' }} />
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {tasks.length === 0 && (
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
              No default tasks yet — add your first one.
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <Button variant="ghost" size="sm" onClick={addTask}>
              <Plus size={13} />
              {t('addTask')}
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}