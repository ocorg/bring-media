import { auth } from '@/lib/auth/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import BackLink from '@/components/ui/BackLink';
import ProjectDetailHeader from '@/components/projects/ProjectDetailHeader';
import ProjectPipelineClient from '@/components/projects/ProjectPipelineClient';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  paused: 'var(--warning)',
  completed: 'var(--muted)',
  archived: 'var(--border)',
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [project, teamMembers] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { select: { id: true, name: true } },
        serviceType: { select: { name: true, color: true } },
        tasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            estimatedHours: true,
            assignedTo: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!project) notFound();

  const stages = (project.pipelineSnapshot as unknown as PipelineStage[]) ?? [];

  const statusColor = STATUS_COLORS[project.status] ?? 'var(--muted)';

  return (
    <div>
      {/* Back */}
      <BackLink href="/projects" label="Back to projects" />

      {/* Header */}
      <div
        style={{
          marginTop: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            {/* Service type badge */}
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: project.serviceType.color,
                background: `${project.serviceType.color}14`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-block',
                marginBottom: '8px',
              }}
            >
              {project.serviceType.name}
            </span>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: '500',
                color: 'var(--text)',
                marginBottom: '4px',
              }}
            >
              {project.name}
            </h1>

            <ProjectDetailHeader
              clientId={project.client.id}
              clientName={project.client.name}
              status={project.status}
              statusColor={statusColor}
            />
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
            {project.startDate && (
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '2px' }}>
                  Start
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)' }}>
                  {new Date(project.startDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {project.endDate && (
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '2px' }}>
                  Due
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text)' }}>
                  {new Date(project.endDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '2px' }}>
                Tasks
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text)' }}>{project.tasks.length}</p>
            </div>
          </div>
        </div>

        {project.description && (
          <p
            style={{
              marginTop: '1rem',
              fontSize: '13px',
              color: 'var(--muted)',
              lineHeight: 1.6,
              maxWidth: '640px',
            }}
          >
            {project.description}
          </p>
        )}
      </div>

      {/* Pipeline + tasks (client interactive zone) */}
      <div style={{ marginBottom: '2rem' }}>
        <ProjectPipelineClient
          projectId={project.id}
          serviceTypeId={project.serviceTypeId}
          stages={stages}
          initialTasks={project.tasks.map((t) => ({
            ...t,
            estimatedHours: t.estimatedHours ? t.estimatedHours.toNumber() : null,
            assignee: t.assignedTo ?? null,
          }))}
          teamMembers={teamMembers}
          userRole={session!.user.role}
          canCreateTask={
            session!.user.role === 'manager' || session!.user.role === 'super_admin'
          }
        />
      </div>
    </div>
  );
}