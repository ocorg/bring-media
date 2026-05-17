'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/session';
import type { Prisma } from '@prisma/client';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─── Shared types ────────────────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  requiresApproval: boolean;
}

export interface BundleTask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number | null;
  defaultPriority: 'urgent' | 'high' | 'normal' | 'low';
  order: number;
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const ServiceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color e.g. #8f00ff'),
  iconName: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

const PipelineStageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Stage name cannot be empty'),
  order: z.number().int(),
  requiresApproval: z.boolean(),
});

const BundleTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title cannot be empty'),
  description: z.string(),
  estimatedHours: z.number().nullable(),
  defaultPriority: z.enum(['urgent', 'high', 'normal', 'low']),
  order: z.number().int(),
});

// ─── Service type actions ─────────────────────────────────────────────────────

export async function createServiceType(data: {
  name: string;
  slug: string;
  color: string;
  iconName?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await withRole(['manager', 'super_admin']);
    const validated = ServiceTypeSchema.parse({ ...data, isActive: true });
    const st = await prisma.serviceType.create({ data: validated });
    revalidatePath('/settings/service-types');
    return { success: true, data: { id: st.id } };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.issues[0]?.message ?? 'Validation failed' };
    console.error('[createServiceType]', error);
    return { success: false, error: 'Failed to create service type' };
  }
}

export async function updateServiceType(
  id: string,
  data: Partial<{ name: string; slug: string; color: string; iconName: string; isActive: boolean }>
): Promise<ActionResult> {
  try {
    await withRole(['manager', 'super_admin']);
    await prisma.serviceType.update({ where: { id }, data });
    revalidatePath('/settings/service-types');
    return { success: true };
  } catch (error) {
    console.error('[updateServiceType]', error);
    return { success: false, error: 'Failed to update service type' };
  }
}

export async function deleteServiceType(id: string): Promise<ActionResult> {
  try {
    await withRole(['manager', 'super_admin']);
    await prisma.serviceType.delete({ where: { id } });
    revalidatePath('/settings/service-types');
    return { success: true };
  } catch (error) {
    console.error('[deleteServiceType]', error);
    return { success: false, error: 'Failed to delete service type — it may have existing projects' };
  }
}

// ─── Pipeline template actions ────────────────────────────────────────────────

export async function savePipelineTemplate(
  serviceTypeId: string,
  stages: PipelineStage[]
): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);
    const validated = z.array(PipelineStageSchema).min(1, 'At least one stage is required').parse(stages);
    await prisma.pipelineTemplate.upsert({
      where: { serviceTypeId },
      create: {
        serviceTypeId,
        stages: validated as unknown as Prisma.InputJsonValue,
        updatedById: session.user.id,
      },
      update: {
        stages: validated as unknown as Prisma.InputJsonValue,
        updatedById: session.user.id,
      },
    });
    revalidatePath('/settings/pipeline-templates');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.issues[0]?.message ?? 'Invalid stages' };
    console.error('[savePipelineTemplate]', error);
    return { success: false, error: 'Failed to save pipeline template' };
  }
}

// ─── Bundle template actions ──────────────────────────────────────────────────

export async function saveBundleTemplate(
  serviceTypeId: string,
  tasks: BundleTask[]
): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);
    const validated = z.array(BundleTaskSchema).parse(tasks);
    await prisma.bundleTemplate.upsert({
      where: { serviceTypeId },
      create: {
        serviceTypeId,
        tasks: validated as unknown as Prisma.InputJsonValue,
        updatedById: session.user.id,
      },
      update: {
        tasks: validated as unknown as Prisma.InputJsonValue,
        updatedById: session.user.id,
      },
    });
    revalidatePath('/settings/bundle-templates');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.issues[0]?.message ?? 'Invalid tasks' };
    console.error('[saveBundleTemplate]', error);
    return { success: false, error: 'Failed to save bundle template' };
  }
}