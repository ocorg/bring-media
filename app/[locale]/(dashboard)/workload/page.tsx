import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import WorkloadClient from '@/components/workload/WorkloadClient';

export default async function WorkloadPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/');

  const members = await prisma.user.findMany({
    where: {
      isHidden: false,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      assignedTasks: {
        where: {
          project: { status: { not: 'archived' } },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
          Workload
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {members.length} team member{members.length !== 1 ? 's' : ''} ·{' '}
          {members.reduce((sum, m) => sum + m.assignedTasks.length, 0)} active tasks
        </p>
      </div>

      <WorkloadClient
        members={members.map((m) => ({
          ...m,
          role: m.role as string,
          tasks: m.assignedTasks,
        }))}
      />
    </div>
  );
}