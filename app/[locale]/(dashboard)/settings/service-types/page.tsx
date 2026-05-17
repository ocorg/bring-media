import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ServiceTypeManager from '@/components/settings/ServiceTypeManager';

export default async function ServiceTypesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/projects');

  const serviceTypes = await prisma.serviceType.findMany({
    orderBy: { name: 'asc' },
  });

  return <ServiceTypeManager initialServiceTypes={serviceTypes} />;
}