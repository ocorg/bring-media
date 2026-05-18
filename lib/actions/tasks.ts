'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, withRole } from '@/lib/auth/session';
import { writeActivityLog } from '@/lib/activity/logger';
import { pusherServer } from '@/lib/pusher/server';
import type { Prisma, Priority } from '@prisma/client';
import type { PipelineStage } from './serviceTypes';
import { createNotification } from './notifications';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Create task ──────────────────────────────────────────────────────────────

const CreateTaskSchema = z.object({
  projectId: z.string().min(1),
  serviceTypeId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  status: z.string().min(1),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  assigneeId: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().optional(),
});

export async function createTask(data: {
  projectId: string;
  serviceTypeId: string;
  title: string;
  description?: string;
  status: string;
  priority?: Priority;
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: string;
}): Promise<ActionResult<{ taskId: string }>> {
  try {
    const session = await withRole(['manager', 'super_admin']);
    const validated = CreateTaskSchema.parse(data);

    const task = await prisma.task.create({
      data: {
        projectId: validated.projectId,
        serviceTypeId: validated.serviceTypeId,
        title: validated.title,
        description: validated.description ?? null,
        status: validated.status,
        priority: (validated.priority as Priority) ?? 'normal',
        assignedToId: validated.assigneeId ?? null,
        estimatedHours: validated.estimatedHours ?? null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        createdById: session.user.id,
      },
    });

    await writeActivityLog({
      entityType: 'task',
      entityId: task.id,
      actorId: session.user.id,
      action: 'task.created',
      projectId: validated.projectId,
      taskId: task.id,
    });

    await pusherServer.trigger(
      `private-project-${validated.projectId}`,
      'task.created',
      { taskId: task.id, title: task.title, status: task.status }
    );

    if (validated.assigneeId && validated.assigneeId !== session.user.id) {
      await createNotification({
        recipientId: validated.assigneeId,
        type: 'task_assigned',
        taskId: task.id,
        payload: {
          title: 'Task assigned to you',
          body: task.title,
          projectId: validated.projectId,
          actorName: session.user.name ?? 'Someone',
        },
      });
    }

    revalidatePath(`/projects/${validated.projectId}`);
    return { success: true, data: { taskId: task.id } };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.issues[0]?.message ?? 'Validation failed' };
    console.error('[createTask]', error);
    return { success: false, error: 'Failed to create task' };
  }
}

// ─── Update task ──────────────────────────────────────────────────────────────

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: Priority;
    assigneeId?: string | null;
    estimatedHours?: number | null;
    dueDate?: string | null;
  }
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, assignedToId: true, createdById: true },
    });
    if (!task) return { success: false, error: 'Task not found' };

    const role = session.user.role;
    const isManager = role === 'manager' || role === 'super_admin';
    const isAssignee = task.assignedToId === session.user.id;
    if (!isManager && !isAssignee)
      return { success: false, error: 'Permission denied' };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assignedToId: data.assigneeId }),
        ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('[updateTask]', error);
    return { success: false, error: 'Failed to update task' };
  }
}

// ─── Update task status (stage advancement) ───────────────────────────────────

export async function updateTaskStatus(
  taskId: string,
  direction: 'advance' | 'back'
): Promise<ActionResult<{ newStatus: string }>> {
  try {
    const session = await requireAuth();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, pipelineSnapshot: true } } },
    });
    if (!task) return { success: false, error: 'Task not found' };

    const stages = (task.project.pipelineSnapshot as unknown as PipelineStage[]);
    const currentIndex = stages.findIndex((s) => s.name === task.status);
    if (currentIndex === -1) return { success: false, error: 'Current stage not found in pipeline' };

    const currentStage = stages[currentIndex]!;

    if (direction === 'advance') {
      if (currentStage.requiresApproval && session.user.role === 'team_member')
        return { success: false, error: 'This stage requires manager approval to advance' };

      const nextStage = stages[currentIndex + 1];
      if (!nextStage) return { success: false, error: 'Already at the final stage' };

      await prisma.task.update({ where: { id: taskId }, data: { status: nextStage.name } });

      await writeActivityLog({
        entityType: 'task',
        entityId: taskId,
        actorId: session.user.id,
        action: 'task.status_changed',
        projectId: task.project.id,
        taskId,
        diff: { from: task.status, to: nextStage.name },
      });

      await pusherServer.trigger(`private-project-${task.project.id}`, 'task.status_changed', {
        taskId,
        from: task.status,
        to: nextStage.name,
      });

      if (task.createdById !== session.user.id) {
        await createNotification({
          recipientId: task.createdById,
          type: 'status_changed',
          taskId,
          payload: {
            title: 'Task status updated',
            body: `"${task.title}" moved to ${nextStage.name}`,
            projectId: task.project.id,
            actorName: session.user.name ?? 'Someone',
          },
        });
      }

      revalidatePath(`/projects/${task.project.id}`);
      return { success: true, data: { newStatus: nextStage.name } };
    }

    // back — no approval needed
    const prevStage = stages[currentIndex - 1];
    if (!prevStage) return { success: false, error: 'Already at the first stage' };

    await prisma.task.update({ where: { id: taskId }, data: { status: prevStage.name } });
    revalidatePath(`/projects/${task.project.id}`);
    return { success: true, data: { newStatus: prevStage.name } };
  } catch (error) {
    console.error('[updateTaskStatus]', error);
    return { success: false, error: 'Failed to update task status' };
  }
}

// ─── Delete task ──────────────────────────────────────────────────────────────

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) return { success: false, error: 'Task not found' };

    await prisma.task.delete({ where: { id: taskId } });

    await writeActivityLog({
      entityType: 'task',
      entityId: taskId,
      actorId: session.user.id,
      action: 'task.deleted',
      projectId: task.projectId,
      taskId,
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('[deleteTask]', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

// ─── Log time ─────────────────────────────────────────────────────────────────

export async function logTime(
  taskId: string,
  hours: number,
  note?: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    if (hours <= 0 || hours > 24) return { success: false, error: 'Hours must be between 0 and 24' };

    await prisma.$transaction(async (tx) => {
      await tx.timeLog.create({
        data: {
          taskId,
          userId: session.user.id,
          hours,
          note: note ?? null,
          loggedDate: new Date(),
        },
      });

      const agg = await tx.timeLog.aggregate({
        where: { taskId },
        _sum: { hours: true },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { actualHours: agg._sum.hours ?? 0 },
      });
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (task) revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('[logTime]', error);
    return { success: false, error: 'Failed to log time' };
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  taskId: string,
  content: string
): Promise<ActionResult<{ commentId: string }>> {
  try {
    const session = await requireAuth();
    if (!content.trim()) return { success: false, error: 'Comment cannot be empty' };

    const comment = await prisma.comment.create({
      data: { taskId, authorId: session.user.id, content: content.trim() },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true, assignedToId: true, createdById: true },
    });

    if (task) {
      await pusherServer.trigger(`private-project-${task.projectId}`, 'task.comment_added', {
        taskId,
        commentId: comment.id,
      });

      // Notify everyone involved — deduped, skip commenter
      const involved = new Set<string>();
      if (task.assignedToId && task.assignedToId !== session.user.id)
        involved.add(task.assignedToId);
      if (task.createdById !== session.user.id)
        involved.add(task.createdById);

      for (const recipientId of involved) {
        await createNotification({
          recipientId,
          type: 'comment_added',
          taskId,
          payload: {
            title: 'New comment',
            body: `${session.user.name ?? 'Someone'} commented on "${task.title}"`,
            projectId: task.projectId,
            actorName: session.user.name ?? 'Someone',
          },
        });
      }

      revalidatePath(`/projects/${task.projectId}`);
    }

    return { success: true, data: { commentId: comment.id } };
  } catch (error) {
    console.error('[addComment]', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function editComment(
  commentId: string,
  content: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    if (!content.trim()) return { success: false, error: 'Comment cannot be empty' };

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, taskId: true },
    });
    if (!comment) return { success: false, error: 'Comment not found' };
    if (comment.authorId !== session.user.id)
      return { success: false, error: 'You can only edit your own comments' };

    await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });

    const task = await prisma.task.findUnique({
      where: { id: comment.taskId },
      select: { projectId: true },
    });
    if (task) revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('[editComment]', error);
    return { success: false, error: 'Failed to edit comment' };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { taskId: true },
    });
    if (!comment) return { success: false, error: 'Comment not found' };

    await prisma.comment.delete({ where: { id: commentId } });

    const task = await prisma.task.findUnique({
      where: { id: comment.taskId },
      select: { projectId: true },
    });
    if (task) revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('[deleteComment]', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}