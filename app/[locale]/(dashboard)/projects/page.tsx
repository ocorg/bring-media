import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Link } from '@/lib/i18n/navigation';
import ProjectCard from '@/components/projects/ProjectCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default async function ProjectsPage() {
  const session = await auth();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      serviceType: { select: { name: true, color: true } },
      _count: { select: { tasks: true } },
    },
  });

  const canCreate =
    session?.user.role === 'manager' || session?.user.role === 'super_admin';

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '500',
              color: 'var(--text)',
              marginBottom: '4px',
            }}
          >
            Projects
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canCreate && (
          <Link href="/projects/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <Plus size={15} />
              New project
            </Button>
          </Link>
        )}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking work."
          action={
            canCreate ? (
              <Link href="/projects/new" style={{ textDecoration: 'none' }}>
                <Button variant="primary">
                  <Plus size={15} />
                  New project
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '12px',
          }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                ...project,
                status: project.status as string,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}