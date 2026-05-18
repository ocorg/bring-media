'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TaskDrawer from '@/components/tasks/TaskDrawer';

interface CalTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  project: { id: string; name: string };
}

interface CalProject {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  serviceType: { color: string; name: string };
}

interface TeamMember {
  id: string;
  name: string;
}

interface Props {
  initialTasks: CalTask[];
  initialProjects: CalProject[];
  initialYear: number;
  initialMonth: number;
  teamMembers: TeamMember[];
  userRole: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#8f00ff',
  low: '#6b7280',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  // Monday = 0
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export default function CalendarGrid({
  initialTasks,
  initialProjects,
  initialYear,
  initialMonth,
  teamMembers,
  userRole,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [tasks, setTasks] = useState<CalTask[]>(initialTasks);
  const [projects, setProjects] = useState<CalProject[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    try {
      const res = await fetch(
        `/api/calendar?from=${isoDate(from)}&to=${isoDate(to)}`
      );
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setProjects(data.projects ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  function goMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
    fetchMonth(newYear, newMonth);
  }

  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);
  const today = isoDate(new Date());
  const cells = Array.from({ length: startOffset + totalDays }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1
  );
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  function getTasksForDay(day: number) {
    const d = isoDate(new Date(year, month, day));
    return tasks.filter((t) => t.dueDate && isoDate(new Date(t.dueDate)) === d);
  }

  function getProjectsForDay(day: number) {
    const d = new Date(year, month, day);
    return projects.filter((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return d >= start && d <= end;
    });
  }

  return (
    <>
      <div>
        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button
            onClick={() => goMonth(-1)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
          >
            <ChevronLeft size={16} />
          </button>

          <h2 style={{ fontSize: '17px', fontWeight: '500', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {MONTH_NAMES[month]} {year}
            {loading && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Loading...</span>}
          </h2>

          <button
            onClick={() => goMonth(1)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {cells.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} style={{ minHeight: '90px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }} />;
            }

            const dayTasks = getTasksForDay(day);
            const dayProjects = getProjectsForDay(day);
            const dateStr = isoDate(new Date(year, month, day));
            const isToday = dateStr === today;

            return (
              <div
                key={day}
                style={{
                  minHeight: '90px',
                  background: isToday ? 'rgba(143,0,255,0.05)' : 'var(--surface)',
                  border: `1px solid ${isToday ? 'var(--brand)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  overflow: 'hidden',
                }}
              >
                {/* Day number */}
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: isToday ? '700' : '400',
                    color: isToday ? 'var(--brand)' : 'var(--muted)',
                    marginBottom: '2px',
                  }}
                >
                  {day}
                </p>

                {/* Project range bars */}
                {dayProjects.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      fontSize: '10px',
                      background: `${p.serviceType.color}22`,
                      borderLeft: `2px solid ${p.serviceType.color}`,
                      color: p.serviceType.color,
                      padding: '1px 4px',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </div>
                ))}

                {/* Task due date chips */}
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    style={{
                      fontSize: '10px',
                      background: `${PRIORITY_COLORS[t.priority]}18`,
                      borderLeft: `2px solid ${PRIORITY_COLORS[t.priority] ?? '#6b7280'}`,
                      color: 'var(--text)',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.8')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                    title={t.title}
                  >
                    {t.title}
                  </button>
                ))}

                {/* Overflow count */}
                {dayTasks.length + dayProjects.length > 5 && (
                  <p style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    +{dayTasks.length + dayProjects.length - 5} more
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onDeleted={() => setSelectedTaskId(null)}
        teamMembers={teamMembers}
        userRole={userRole}
      />
    </>
  );
}