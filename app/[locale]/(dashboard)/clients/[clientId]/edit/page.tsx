import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { notFound, redirect } from 'next/navigation';
import ClientForm from '@/components/clients/ClientForm';
import BackLink from '@/components/ui/BackLink';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ locale: string; clientId: string }>;
}) {
  const session = await auth();
  const { locale, clientId } = await params;

  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role === 'team_member') redirect(`/${locale}/clients/${clientId}`);

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) notFound();

  return (
    <div>
      <BackLink href={`/clients/${clientId}`} label={client.name} />

      <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '2rem' }}>
        Edit client
      </h1>

      <ClientForm
        mode="edit"
        clientId={clientId}
        defaultValues={{
          name: client.name,
          industry: client.industry,
          logoUrl: client.logoUrl,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
          retainerType: client.retainerType,
          contractStart: client.contractStart,
          contractEnd: client.contractEnd,
          driveFolderUrl: client.driveFolderUrl,
          brandKitUrl: client.brandKitUrl,
          websiteUrl: client.websiteUrl,
          internalNotes: client.internalNotes,
        }}
      />
    </div>
  );
}