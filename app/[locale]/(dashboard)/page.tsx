import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Link } from '@/lib/i18n/navigation';
import KpiCard from '@/components/dashboard/KpiCard';
import OverdueList from '@/components/dashboard/OverdueList';
import WorkloadChart from '@/components/dashboard/WorkloadChart';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react';

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isManager =
    session.user.role === 'manager' || session.user.role === 'super_admin';
  const userId = session.user.id;

  const taskFilter = isManager ? {} : { assignedToId: userId };
  const now = new Date();

  const [
    activeProjects,
    openTasks,
    overdueTasks,
    totalClients,
    hoursResult,
    overdueList,
    members,
  ] = await Promise.all([
    prisma.project.count({ where: { status: 'active' } }),
    prisma.task.count({ where: { ...taskFilter } }),
    prisma.task.count({ where: { ...taskFilter, dueDate: { lt: now } } }),
    prisma.client.count(),
    prisma.timeLog.aggregate({
      _sum: { hours: true },
      where: { createdAt: { gte: startOfMonth() } },
    }),
    prisma.task.findMany({
      where: { ...taskFilter, dueDate: { lt: now } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: { select: { id: true, name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    isManager
      ? prisma.user.findMany({
          where: {
            isHidden: false,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            assignedTasks: {
              where: { project: { status: { not: 'archived' } } },
              select: { priority: true },
            },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  const hoursLogged = hoursResult._sum.hours ? Number(hoursResult._sum.hours).toFixed(1) : '0';

  const chartData = members.map((m) => ({
    name: m.name.split(' ')[0],
    urgent: m.assignedTasks.filter((t) => t.priority === 'urgent').length,
    high: m.assignedTasks.filter((t) => t.priority === 'high').length,
    normal: m.assignedTasks.filter((t) => t.priority === 'normal').length,
    low: m.assignedTasks.filter((t) => t.priority === 'low').length,
  }));

  const kpis = [
    {
      label: 'Active projects',
      value: activeProjects,
      accent: '#8f00ff',
      fillPercent: Math.min((activeProjects / 20) * 100, 100),
      icon: <FolderKanban size={16} />,
    },
    {
      label: 'Open tasks',
      value: openTasks,
      accent: '#22c55e',
      fillPercent: Math.min((openTasks / 100) * 100, 100),
      icon: <CheckSquare size={16} />,
    },
    {
      label: 'Overdue tasks',
      value: overdueTasks,
      subtitle: overdueTasks > 0 ? 'Need attention' : 'All on track',
      accent: overdueTasks > 0 ? '#ef4444' : '#22c55e',
      fillPercent: Math.min((overdueTasks / (openTasks || 1)) * 100, 100),
      icon: <AlertTriangle size={16} />,
    },
    {
      label: 'Total clients',
      value: totalClients,
      accent: '#f59e0b',
      fillPercent: Math.min((totalClients / 50) * 100, 100),
      icon: <Users size={16} />,
    },
    {
      label: 'Hours this month',
      value: hoursLogged + 'h',
      accent: '#6366f1',
      fillPercent: Math.min((parseFloat(hoursLogged) / 200) * 100, 100),
      icon: <Clock size={16} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isManager ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
              Overdue tasks
            </p>
            <Link href="/projects" style={{ fontSize: '12px', color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              All projects <ArrowRight size={11} />
            </Link>
          </div>
          <OverdueList tasks={overdueList} />
        </div>

        {isManager && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>
                Team workload
              </p>
              <Link href="/workload" style={{ fontSize: '12px', color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Full view <ArrowRight size={11} />
              </Link>
            </div>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
              }}
            >
              <WorkloadChart data={chartData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}