import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Link } from '@/lib/i18n/navigation';
import ClientCard from '@/components/clients/ClientCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ClientsPage() {
  const session = await auth();
  const t = await getTranslations('clients');

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { projects: true } },
    },
  });

  const canCreate = session?.user.role === 'manager' || session?.user.role === 'super_admin';

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
            {t('title')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canCreate && (
          <Link href="/clients/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <Plus size={15} />
              {t('new')}
            </Button>
          </Link>
        )}
      </div>

      {/* Grid */}
      {clients.length === 0 ? (
        <EmptyState
          title={t('empty')}
          description={t('emptyDescription')}
          action={
            canCreate ? (
              <Link href="/clients/new" style={{ textDecoration: 'none' }}>
                <Button variant="primary">
                  <Plus size={15} />
                  {t('new')}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '12px',
        }}>
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={{
                ...client,
                healthStatus: client.healthStatus as 'healthy' | 'at_risk' | 'critical',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}