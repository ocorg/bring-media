'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteClient } from '@/lib/actions/clients';
import { useToast } from '@/lib/hooks/useToast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Link } from '@/lib/i18n/navigation';
import { Pencil, Trash2 } from 'lucide-react';

interface ClientActionsProps {
  clientId: string;
  clientName: string;
  locale: string;
}

export default function ClientActions({ clientId, clientName, locale }: ClientActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(clientId);
    if (result.success) {
      toast('Client deleted', 'success');
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
            Edit
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={13} />
          Delete
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete client">
        <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
          Are you sure you want to delete <strong>{clientName}</strong>?
        </p>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          This will permanently remove the client and all associated data. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete client</Button>
        </div>
      </Modal>
    </>
  );
}