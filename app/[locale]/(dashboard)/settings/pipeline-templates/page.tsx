import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import PipelineTemplateEditor from '@/components/settings/PipelineTemplateEditor';

export default async function PipelineTemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/projects');

  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    include: { pipelineTemplate: true },
    orderBy: { name: 'asc' },
  });

  return <PipelineTemplateEditor serviceTypes={serviceTypes} />;
}