'use client';

import { useState } from 'react';
import PipelineView from '@/components/projects/PipelineView';
import TaskDrawer from '@/components/tasks/TaskDrawer';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import type { PipelineStage } from '@/lib/actions/serviceTypes';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedHours: number | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { comments: number; attachments: number };
}

interface TeamMember {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  serviceTypeId: string;
  stages: PipelineStage[];
  initialTasks: Task[];
  teamMembers: TeamMember[];
  userRole: string;
  canCreateTask: boolean;
}

export default function ProjectPipelineClient({
  projectId,
  serviceTypeId,
  stages,
  initialTasks,
  teamMembers,
  userRole,
  canCreateTask,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <>
      {/* Pipeline header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Pipeline
        </p>
        {canCreateTask && (
          <Button variant="primary" size="sm" onClick={() => setNewTaskOpen(true)}>
            <Plus size={13} />
            New task
          </Button>
        )}
      </div>

      {/* Kanban board */}
      {stages.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
          No pipeline stages — this project has no snapshot.
        </p>
      ) : (
        <PipelineView
          stages={stages}
          tasks={tasks}
          onTaskClick={setSelectedTaskId}
        />
      )}

      {/* Task drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onDeleted={handleTaskDeleted}
        teamMembers={teamMembers}
        userRole={userRole}
      />

      {/* New task modal */}
      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        projectId={projectId}
        serviceTypeId={serviceTypeId}
        stages={stages}
        teamMembers={teamMembers}
      />
    </>
  );
}