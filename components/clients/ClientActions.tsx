'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteClient } from '@/lib/actions/clients';
import { useToast } from '@/lib/hooks/useToast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Link } from '@/lib/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ClientActionsProps {
  clientId: string;
  clientName: string;
  locale: string;
}

export default function ClientActions({ clientId, clientName, locale }: ClientActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(clientId);
    if (result.success) {
      toast(t('deleted'), 'success');
      router.push(`/${locale}/clients`);
    } else {
      toast(result.error, 'error');
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <Link href={`/clients/${clientId}/edit`}>
          <Button variant="secondary" size="sm">
            <Pencil size={13} />
            {t('edit')}
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={13} />
          {t('delete')}
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t('deleteTitle')}>
        <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
          {t('deleteConfirm')} <strong>{clientName}</strong>?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {t('deleteWarning')}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{tc('cancel')}</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>{t('deleteBtn')}</Button>
        </div>
      </Modal>
    </>
  );
}