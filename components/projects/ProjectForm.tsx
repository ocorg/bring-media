'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { createProject } from '@/lib/actions/projects';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GripVertical,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
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
import type { PipelineStage } from '@/lib/actions/serviceTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  industry: string | null;
}

interface ServiceTypeOption {
  id: string;
  name: string;
  slug: string;
  color: string;
  pipelineTemplate: { stages: PipelineStage[] } | null;
}

interface Props {
  clients: Client[];
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '2rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? '20px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i === current ? 'var(--brand)' : i < current ? 'var(--muted)' : 'var(--border)',
            transition: 'all 250ms ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Sortable stage row (step 3) ──────────────────────────────────────────────

function SortableStage({
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

  function t(arg0: string): string | undefined {
    throw new Error('Function not implemented.');
  }

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
        padding: '10px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '6px',
      }}
    >
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
          touchAction: 'none',
        }}
      >
        <GripVertical size={14} />
      </button>

      <span style={{ fontSize: '11px', color: 'var(--muted)', width: '16px', textAlign: 'center' }}>
        {stage.order + 1}
      </span>

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
        }}
      />

      <button
        onClick={() => onApprovalToggle(stage.id)}
        title={t('toggleApproval')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: stage.requiresApproval ? 'var(--brand)' : 'var(--border)',
          padding: '2px',
          display: 'flex',
          transition: 'color 150ms ease',
        }}
      >
        <ShieldCheck size={15} />
      </button>

      <button
        onClick={() => onDelete(stage.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          opacity: 0.5,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.5')}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function ProjectForm({ clients }: Props) {
  const t = useTranslations('projects');
  const router = useRouter();
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Step 2
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(false);
  const [serviceTypeId, setServiceTypeId] = useState('');

  // Step 3
  const [stages, setStages] = useState<PipelineStage[]>([]);

  // Step 4
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load service types when entering step 2
  useEffect(() => {
    if (step !== 2 || serviceTypes.length > 0) return;
    setServiceTypesLoading(true);
    fetch('/api/service-types')
      .then((r) => r.json())
      .then((data) => setServiceTypes(data.serviceTypes ?? []))
      .catch(() => toast('Failed to load service types', 'error'))
      .finally(() => setServiceTypesLoading(false));
  }, [step]);

  // ── Filtered clients ──────────────────────────────────────────────────────
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedST = serviceTypes.find((s) => s.id === serviceTypeId);

  // ── Stage helpers (step 3) ────────────────────────────────────────────────
  function loadStages(stId: string) {
    const st = serviceTypes.find((s) => s.id === stId);
    const template = (st?.pipelineTemplate?.stages ?? []) as PipelineStage[];
    setStages(
      template.length > 0
        ? template
        : [{ id: crypto.randomUUID(), name: 'Backlog', order: 0, requiresApproval: false }]
    );
  }

  function handleStageNameChange(id: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function handleStageApprovalToggle(id: string) {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, requiresApproval: !s.requiresApproval } : s))
    );
  }

  function handleStageDelete(id: string) {
    setStages((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }))
    );
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

  // ── Navigation ────────────────────────────────────────────────────────────
  function goNext() {
    if (step === 1 && !clientId) {
      toast('Please select a client', 'error');
      return;
    }
    if (step === 2 && !serviceTypeId) {
      toast('Please select a service type', 'error');
      return;
    }
    if (step === 2) {
      loadStages(serviceTypeId);
    }
    if (step === 3 && stages.some((s) => !s.name.trim())) {
      toast('All stages must have a name', 'error');
      return;
    }
    if (step < 4) setStep((s) => (s + 1) as typeof step);
  }

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as typeof step);
  }

  // ── Submit (step 4) ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!name.trim()) {
      toast('Project name is required', 'error');
      return;
    }
    setSubmitting(true);
    const res = await createProject({
      clientId,
      serviceTypeId,
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      pipelineSnapshot: stages,
    });
    setSubmitting(false);
    if (!res.success) {
      toast(res.error, 'error');
      return;
    }
    toast('Project created', 'success');
    router.push(`/projects/${res.data!.projectId}` as `/${string}`);
  }

  // ─── Render steps ─────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '600px' }}>
      <StepDots current={step - 1} total={4} />

      {/* ── Step 1: Select client ── */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
            Select a client
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Which client is this project for?
          </p>

          <input
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Search clients..."
            style={{ marginBottom: '10px' }}
          />

          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              maxHeight: '320px',
              overflowY: 'auto',
            }}
          >
            {filteredClients.length === 0 ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                No clients found
              </p>
            ) : (
              filteredClients.map((client, i) => (
                <button
                  key={client.id}
                  onClick={() => setClientId(client.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background:
                      clientId === client.id ? 'rgba(143,0,255,0.08)' : 'transparent',
                    border: 'none',
                    borderBottom:
                      i < filteredClients.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (clientId !== client.id)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (clientId !== client.id)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background:
                        clientId === client.id ? 'var(--brand)' : 'var(--border)',
                      transition: 'background 150ms ease',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                      {client.name}
                    </p>
                    {client.industry && (
                      <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {client.industry}
                      </p>
                    )}
                  </div>
                  {clientId === client.id && (
                    <Check
                      size={14}
                      color="var(--brand)"
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Select service type ── */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
            {t('form.selectServiceType')}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            For{' '}
            <strong style={{ color: 'var(--text)' }}>{selectedClient?.name}</strong>
          </p>

          {serviceTypesLoading ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading service types...</p>
          ) : serviceTypes.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              No active service types found. Create one in{' '}
              <a href="/settings/service-types" style={{ color: 'var(--brand)' }}>
                Settings → Service types
              </a>
              .
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {serviceTypes.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setServiceTypeId(st.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background:
                      serviceTypeId === st.id
                        ? `${st.color}12`
                        : 'var(--surface)',
                    borderTop: `1px solid ${serviceTypeId === st.id ? st.color : 'var(--border)'}`,
                    borderRight: `1px solid ${serviceTypeId === st.id ? st.color : 'var(--border)'}`,
                    borderBottom: `1px solid ${serviceTypeId === st.id ? st.color : 'var(--border)'}`,
                    borderLeft: `3px solid ${st.color}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: st.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text)',
                      flex: 1,
                    }}
                  >
                    {st.name}
                  </span>
                  {st.pipelineTemplate && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {(st.pipelineTemplate.stages as PipelineStage[]).length} stages
                    </span>
                  )}
                  {serviceTypeId === st.id && (
                    <Check size={14} color={st.color} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Edit pipeline stages ── */}
      {step === 3 && (
        <div>
          <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
            Review pipeline stages
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Drag to reorder, rename, or toggle approval gates. This snapshot is locked once the project is created.
          </p>

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
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  onNameChange={handleStageNameChange}
                  onApprovalToggle={handleStageApprovalToggle}
                  onDelete={handleStageDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={addStage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--muted)',
              fontSize: '12px',
              padding: '8px 14px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '4px',
              transition: 'border-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
            }}
          >
            <Plus size={13} />
            Add stage
          </button>

          {/* Approval legend */}
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={11} color="var(--brand)" />
            Blue shield = approval required before advancing to next stage
          </p>
        </div>
      )}

      {/* ── Step 4: Project details ── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
              Project details
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.25rem' }}>
              <span style={{ color: selectedST?.color }}>{selectedST?.name}</span>
              {' for '}
              <span style={{ color: 'var(--text)' }}>{selectedClient?.name}</span>
            </p>
          </div>

          <Input
            label={t('form.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q3 SEO Campaign"
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label
              style={{
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              {t('form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label={t('form.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label={t('form.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          gap: '10px',
        }}
      >
        <Button
          variant="secondary"
          onClick={step === 1 ? () => router.push('/projects') : goBack}
        >
          <ArrowLeft size={14} />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 4 ? (
          <Button variant="primary" onClick={goNext}>
            Next
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            {t('form.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}