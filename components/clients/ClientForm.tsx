'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { createClient, updateClient } from '@/lib/actions/clients';
import { useToast } from '@/lib/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Upload, ImageIcon } from 'lucide-react';

interface ClientFormProps {
  mode?: 'create' | 'edit';
  clientId?: string;
  defaultValues?: {
    name?: string;
    industry?: string | null;
    logoUrl?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    retainerType?: string | null;
    contractStart?: Date | null;
    contractEnd?: Date | null;
    driveFolderUrl?: string | null;
    brandKitUrl?: string | null;
    websiteUrl?: string | null;
    internalNotes?: string | null;
  };
}

function toDateInput(date?: Date | null): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', marginTop: '1.75rem' }}>
      <p style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {children}
      </p>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {children}
    </div>
  );
}

export default function ClientForm({ mode = 'create', clientId, defaultValues }: ClientFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(defaultValues?.logoUrl ?? '');
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        console.error('[upload/logo] non-JSON response:', text.slice(0, 200));
        throw new Error('Upload server error — check terminal for details');
      }
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setLogoUrl(json.url);
      toast('Logo uploaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (logoUrl) formData.set('logoUrl', logoUrl);

    if (mode === 'edit' && clientId) {
      const result = await updateClient(clientId, formData);
      if (result.success) {
        toast('Client updated', 'success');
        router.push(`/${locale}/clients/${clientId}`);
      } else {
        toast(result.error, 'error');
        setLoading(false);
      }
    } else {
      const result = await createClient(formData);
      if (result.success && result.data) {
        toast('Client created', 'success');
        router.push(`/${locale}/clients/${result.data.clientId}`);
      } else if (!result.success) {
        toast(result.error, 'error');
        setLoading(false);
      }
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ maxWidth: '680px' }}>

      {/* Logo upload */}
      <div
        onClick={() => !logoUploading && fileInputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
          border: `1px dashed ${logoUrl ? 'var(--brand)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', cursor: logoUploading ? 'wait' : 'pointer',
          transition: 'border-color 150ms ease', marginBottom: '8px',
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImageIcon size={20} color="var(--muted)" />
          </div>
        )}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>
            {logoUploading ? 'Uploading...' : logoUrl ? 'Logo uploaded — click to replace' : 'Upload client logo'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>PNG, JPG, WebP — max 10 MB</p>
        </div>
        <Upload size={16} color="var(--muted)" style={{ marginLeft: 'auto' }} />
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoSelect} style={{ display: 'none' }} />

      <SectionLabel>Basic information</SectionLabel>
      <FieldRow>
        <Input label="Client name *" name="name" required placeholder="ACME Corp" defaultValue={defaultValues?.name} />
        <Input label="Industry" name="industry" placeholder="E-commerce" defaultValue={defaultValues?.industry ?? ''} />
      </FieldRow>

      <SectionLabel>Contact</SectionLabel>
      <FieldRow>
        <Input label="Contact name" name="contactName" placeholder="Jane Doe" defaultValue={defaultValues?.contactName ?? ''} />
        <Input label="Contact email" name="contactEmail" type="email" placeholder="jane@acme.com" defaultValue={defaultValues?.contactEmail ?? ''} />
      </FieldRow>
      <FieldRow>
        <Input label="Contact phone" name="contactPhone" placeholder="+212 6XX XXX XXX" defaultValue={defaultValues?.contactPhone ?? ''} />
        <Input label="Retainer type" name="retainerType" placeholder="Monthly / Project" defaultValue={defaultValues?.retainerType ?? ''} />
      </FieldRow>

      <SectionLabel>Contract</SectionLabel>
      <FieldRow>
        <Input label="Contract start" name="contractStart" type="date" defaultValue={toDateInput(defaultValues?.contractStart)} />
        <Input label="Contract end" name="contractEnd" type="date" defaultValue={toDateInput(defaultValues?.contractEnd)} />
      </FieldRow>

      <SectionLabel>Linked assets</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Input label="Google Drive folder URL" name="driveFolderUrl" type="url" placeholder="https://drive.google.com/..." defaultValue={defaultValues?.driveFolderUrl ?? ''} />
        <Input label="Brand kit URL" name="brandKitUrl" type="url" placeholder="https://..." defaultValue={defaultValues?.brandKitUrl ?? ''} />
        <Input label="Website URL" name="websiteUrl" type="url" placeholder="https://acme.com" defaultValue={defaultValues?.websiteUrl ?? ''} />
      </div>

      <SectionLabel>Internal notes</SectionLabel>
      <textarea name="internalNotes" placeholder="Notes visible to the team only..." rows={4} style={{ resize: 'vertical' }} defaultValue={defaultValues?.internalNotes ?? ''} />

      <div style={{ marginTop: '2rem', display: 'flex', gap: '12px' }}>
        <Button type="submit" variant="primary" loading={loading}>
          {mode === 'edit' ? 'Save changes' : 'Create client'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}