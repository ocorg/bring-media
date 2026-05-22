import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import CalendarGrid from '@/components/calendar/CalendarGrid';

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);

  const isManager =
    session.user.role === 'manager' || session.user.role === 'super_admin';
  const taskFilter = isManager ? {} : { assignedToId: session.user.id };

  const [tasks, projects, teamMembers] = await Promise.all([
    prisma.task.findMany({
      where: { ...taskFilter, dueDate: { gte: from, lte: to } },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.project.findMany({
      where: { startDate: { lte: to }, endDate: { gte: from } },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        serviceType: { select: { color: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        isHidden: false,
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
          Calendar
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Task due dates and project timelines.
        </p>
      </div>

      <CalendarGrid
        initialTasks={tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate?.toISOString() ?? '',
        }))}
        initialProjects={projects.map((p) => ({
          ...p,
          startDate: p.startDate?.toISOString() ?? '',
          endDate: p.endDate?.toISOString() ?? '',
        }))}
        initialYear={year}
        initialMonth={month}
        teamMembers={teamMembers}
        userRole={session.user.role}
      />
    </div>
  );
}