import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { notFound, redirect } from 'next/navigation';
import HealthIndicator from '@/components/clients/HealthIndicator';
import ClientFolderTabs from '@/components/clients/ClientFolderTabs';
import Avatar from '@/components/ui/Avatar';
import BackLink from '@/components/ui/BackLink';
import ClientActions from '@/components/clients/ClientActions';

export default async function ClientFolderPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const session = await auth();
  const { locale, clientId } = await params;

  if (!session?.user) redirect(`/${locale}/login`);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
        include: {
          serviceType: { select: { name: true, color: true } },
          _count: { select: { tasks: true } },
        },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { actor: { select: { name: true, avatarUrl: true } } },
      },
      _count: { select: { projects: true } },
    },
  });

  if (!client) notFound();

  const canEdit = session.user.role === 'manager' || session.user.role === 'super_admin';

  return (
    <div>
      <BackLink href="/clients" label="Clients" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {client.logoUrl ? (
          <img src={client.logoUrl} alt={client.name} width={56} height={56} style={{ borderRadius: 'var(--radius-lg)', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <Avatar name={client.name} size={56} />
        )}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)' }}>{client.name}</h1>
            <HealthIndicator clientId={client.id} status={client.healthStatus} canEdit={canEdit} />
            {canEdit && <ClientActions clientId={client.id} clientName={client.name} locale={locale} />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {client.industry && <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{client.industry}</span>}
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{client._count.projects} project{client._count.projects !== 1 ? 's' : ''}</span>
            {client.websiteUrl && (
              <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--brand)', textDecoration: 'none' }}>
                {client.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      <ClientFolderTabs client={client} canEdit={canEdit} locale={locale} />
    </div>
  );
}