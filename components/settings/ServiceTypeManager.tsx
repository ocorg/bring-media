'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/lib/hooks/useToast';
import {
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from '@/lib/actions/serviceTypes';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Pencil, Trash2, Circle } from 'lucide-react';
import type { ServiceType } from '@prisma/client';

interface Props {
  initialServiceTypes: ServiceType[];
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type FormData = {
  name: string;
  slug: string;
  color: string;
  iconName: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  color: '#8f00ff',
  iconName: '',
};

export default function ServiceTypeManager({ initialServiceTypes }: Props) {
  const t = useTranslations('settings.serviceTypes');
  const { toast } = useToast();

  const [types, setTypes] = useState<ServiceType[]>(initialServiceTypes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(st: ServiceType) {
    setEditingId(st.id);
    setForm({
      name: st.name,
      slug: st.slug,
      color: st.color,
      iconName: st.iconName ?? '',
    });
    setModalOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: editingId ? f.slug : slugify(name),
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (editingId) {
        const res = await updateServiceType(editingId, {
          name: form.name,
          slug: form.slug,
          color: form.color,
          iconName: form.iconName || undefined,
        });
        if (!res.success) return toast(res.error, 'error');
        setTypes((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? { ...s, name: form.name, slug: form.slug, color: form.color, iconName: form.iconName || null }
              : s
          )
        );
        toast('Service type updated', 'success');
      } else {
        const res = await createServiceType({
          name: form.name,
          slug: form.slug,
          color: form.color,
          iconName: form.iconName || undefined,
        });
        if (!res.success) return toast(res.error, 'error');
        // Optimistic: reload will happen on next navigation; add placeholder
        setTypes((prev) => [
          ...prev,
          {
            id: res.data!.id,
            name: form.name,
            slug: form.slug,
            color: form.color,
            iconName: form.iconName || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        toast('Service type created', 'success');
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(st: ServiceType) {
    const res = await updateServiceType(st.id, { isActive: !st.isActive });
    if (!res.success) return toast(res.error, 'error');
    setTypes((prev) =>
      prev.map((s) => (s.id === st.id ? { ...s, isActive: !s.isActive } : s))
    );
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await deleteServiceType(id);
    setDeletingId(null);
    if (!res.success) return toast(res.error, 'error');
    setTypes((prev) => prev.filter((s) => s.id !== id));
    toast('Service type deleted', 'success');
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>
            {t('title')}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
            {t('subtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={13} />
          {t('new')}
        </Button>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {types.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '13px',
              padding: '2.5rem',
            }}
          >
            No service types yet — create your first one.
          </p>
        ) : (
          types.map((st, i) => (
            <div
              key={st.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderBottom:
                  i < types.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Color swatch */}
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: st.color,
                  flexShrink: 0,
                }}
              />

              {/* Name + slug */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text)',
                  }}
                >
                  {st.name}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {st.slug}
                </p>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(st)}
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  background: st.isActive
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(139,127,168,0.1)',
                  color: st.isActive ? 'var(--success)' : 'var(--muted)',
                  transition: 'all 150ms ease',
                }}
              >
                {st.isActive ? t('active') : 'Inactive'}
              </button>

              {/* Edit */}
              <button
                onClick={() => openEdit(st)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Pencil size={13} />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(st.id)}
                disabled={deletingId === st.id}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: 'var(--radius-sm)',
                  opacity: deletingId === st.id ? 0.5 : 1,
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit service type' : 'New service type'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label={t('name')}
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. SEO, Social Media"
          />
          <Input
            label={t('slug')}
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="e.g. seo, social-media"
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
              {t('color')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                style={{
                  width: '40px',
                  height: '36px',
                  padding: '2px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                {form.color}
              </span>
            </div>
          </div>
          <Input
            label="Icon name (lucide)"
            value={form.iconName}
            onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
            placeholder="optional, e.g. Search, BarChart2"
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              {editingId ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}