import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import ProjectForm from '@/components/projects/ProjectForm';
import BackLink from '@/components/ui/BackLink';

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/projects');

  const clients = await prisma.client.findMany({
    select: { id: true, name: true, industry: true },
    orderBy: { name: 'asc' },
  });

  if (clients.length === 0) {
    redirect('/clients/new');
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <BackLink href="/projects" label="Back to projects" />
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: 'var(--text)',
            marginTop: '12px',
            marginBottom: '4px',
          }}
        >
          New project
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Follow the steps to configure and create the project.
        </p>
      </div>

      <ProjectForm clients={clients} />
    </div>
  );
}