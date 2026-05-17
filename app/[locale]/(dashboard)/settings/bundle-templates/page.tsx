import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import BundleTemplateEditor from '@/components/settings/BundleTemplateEditor';

export default async function BundleTemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/projects');

  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    include: { bundleTemplate: true },
    orderBy: { name: 'asc' },
  });

  return <BundleTemplateEditor serviceTypes={serviceTypes} />;
}