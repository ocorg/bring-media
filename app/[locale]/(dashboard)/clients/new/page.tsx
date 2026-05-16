import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import ClientForm from '@/components/clients/ClientForm';
import BackLink from '@/components/ui/BackLink';

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role === 'team_member') redirect(`/${locale}/clients`);

  return (
    <div>
      {/* Back link */}
      <BackLink href="/clients" label="Clients" />

      <h1 style={{
        fontSize: '22px',
        fontWeight: '500',
        color: 'var(--text)',
        marginBottom: '2rem',
      }}>
        New client
      </h1>

      <ClientForm />
    </div>
  );
}