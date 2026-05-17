'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/session';
import { writeActivityLog } from '@/lib/activity/logger';
import { pusherServer } from '@/lib/pusher/server';
import type { Prisma } from '@prisma/client';
import type { PipelineStage } from './serviceTypes';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  order: z.number().int(),
  requiresApproval: z.boolean(),
});

const ProjectSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  serviceTypeId: z.string().min(1, 'Service type is required'),
  name: z.string().min(1, 'Project name is required').max(120),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  pipelineSnapshot: z
    .array(PipelineStageSchema)
    .min(1, 'Pipeline must have at least one stage'),
});

export async function createProject(data: {
  clientId: string;
  serviceTypeId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  pipelineSnapshot: PipelineStage[];
}): Promise<ActionResult<{ projectId: string }>> {
  try {
    const session = await withRole(['manager', 'super_admin']);
    const validated = ProjectSchema.parse(data);

    // Load bundle template to auto-seed tasks
    const bundleTemplate = await prisma.bundleTemplate.findUnique({
      where: { serviceTypeId: validated.serviceTypeId },
    });

    const bundleTasks = (bundleTemplate?.tasks ?? []) as Array<{
      id: string;
      title: string;
      description: string;
      estimatedHours: number | null;
      defaultPriority: string;
      order: number;
    }>;

    const firstStage = validated.pipelineSnapshot[0]!.name;

    // Atomic: project + tasks together
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          clientId: validated.clientId,
          serviceTypeId: validated.serviceTypeId,
          name: validated.name,
          description: validated.description ?? null,
          startDate: validated.startDate ? new Date(validated.startDate) : null,
          endDate: validated.endDate ? new Date(validated.endDate) : null,
          pipelineSnapshot:
            validated.pipelineSnapshot as unknown as Prisma.InputJsonValue,
          createdById: session.user.id,
        },
      });

      if (bundleTasks.length > 0) {
        await tx.task.createMany({
          data: bundleTasks.map((t) => ({
            projectId: proj.id,
            serviceTypeId: validated.serviceTypeId,
            title: t.title,
            description: t.description || null,
            status: firstStage,
            priority:
              (t.defaultPriority as 'urgent' | 'high' | 'normal' | 'low') ??
              'normal',
            estimatedHours: t.estimatedHours ?? null,
            createdById: session.user.id,
          })),
        });
      }

      return proj;
    });

    // Activity log — after successful write
    await writeActivityLog({
      entityType: 'project',
      entityId: project.id,
      actorId: session.user.id,
      action: 'project.created',
      clientId: validated.clientId,
      projectId: project.id,
    });

    // Pusher — after DB write, never before
    await pusherServer.trigger('private-dashboard', 'project.created', {
      projectId: project.id,
      name: project.name,
      actorId: session.user.id,
    });

    revalidatePath('/projects');
    revalidatePath(`/clients/${validated.clientId}`);

    return { success: true, data: { projectId: project.id } };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.issues[0]?.message ?? 'Validation failed' };
    console.error('[createProject]', error);
    return { success: false, error: 'Failed to create project' };
  }
}