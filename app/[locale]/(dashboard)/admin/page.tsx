import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import AdminClient from '@/components/admin/AdminClient';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'super_admin') redirect('/');

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'maintenance_mode' },
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
          Admin
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Super admin controls — handle with care.
        </p>
      </div>

      <AdminClient
        initialMaintenanceMode={setting?.value === 'true'}
        adminEmail={session.user.email ?? ''}
      />
    </div>
  );
}