import { prisma } from '@/lib/db/prisma';
import { Prisma, type EntityType } from '@prisma/client';

interface LogActivityParams {
  entityType: EntityType;
  entityId: string;
  actorId: string;
  action: string;
  clientId?: string;
  projectId?: string;
  taskId?: string;
  diff?: Record<string, unknown>;
}

export async function writeActivityLog(
  params: LogActivityParams
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      action: params.action,
      clientId: params.clientId ?? null,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      diff: params.diff as Prisma.InputJsonValue | undefined,
    },
  });
}