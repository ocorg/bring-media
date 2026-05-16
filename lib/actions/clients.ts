'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { withRole } from '@/lib/auth/session';
import { writeActivityLog } from '@/lib/activity/logger';
import type { HealthStatus } from '@prisma/client';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const ClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  industry: z.string().max(100).optional(),
  logoUrl: z.string().optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  retainerType: z.string().max(100).optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  driveFolderUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  brandKitUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  internalNotes: z.string().max(5000).optional(),
});

function clean(value: FormDataEntryValue | null): string | undefined {
  const str = value as string;
  return str && str.trim() !== '' ? str.trim() : undefined;
}

export async function createClient(
  formData: FormData
): Promise<ActionResult<{ clientId: string }>> {
  try {
    const session = await withRole(['manager', 'super_admin']);

    const raw = {
      name: clean(formData.get('name')) ?? '',
      industry: clean(formData.get('industry')),
      logoUrl: clean(formData.get('logoUrl')),
      contactName: clean(formData.get('contactName')),
      contactEmail: clean(formData.get('contactEmail')) ?? '',
      contactPhone: clean(formData.get('contactPhone')),
      retainerType: clean(formData.get('retainerType')),
      contractStart: clean(formData.get('contractStart')),
      contractEnd: clean(formData.get('contractEnd')),
      driveFolderUrl: clean(formData.get('driveFolderUrl')) ?? '',
      brandKitUrl: clean(formData.get('brandKitUrl')) ?? '',
      websiteUrl: clean(formData.get('websiteUrl')) ?? '',
      internalNotes: clean(formData.get('internalNotes')),
    };

    const validated = ClientSchema.parse(raw);

    const client = await prisma.client.create({
      data: {
        name: validated.name,
        industry: validated.industry ?? null,
        logoUrl: validated.logoUrl ?? null,
        contactName: validated.contactName ?? null,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone ?? null,
        retainerType: validated.retainerType ?? null,
        contractStart: validated.contractStart
          ? new Date(validated.contractStart)
          : null,
        contractEnd: validated.contractEnd
          ? new Date(validated.contractEnd)
          : null,
        driveFolderUrl: validated.driveFolderUrl || null,
        brandKitUrl: validated.brandKitUrl || null,
        websiteUrl: validated.websiteUrl || null,
        internalNotes: validated.internalNotes ?? null,
        createdById: session.user.id,
      },
    });

    await writeActivityLog({
      entityType: 'client',
      entityId: client.id,
      actorId: session.user.id,
      action: 'client.created',
      clientId: client.id,
    });

    revalidatePath('/clients');

    return { success: true, data: { clientId: client.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Validation failed' };
    }
    console.error('[createClient]', error);
    return { success: false, error: 'Failed to create client' };
  }
}

export async function updateClient(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);

    const raw = {
      name: clean(formData.get('name')) ?? '',
      industry: clean(formData.get('industry')),
      logoUrl: clean(formData.get('logoUrl')),
      contactName: clean(formData.get('contactName')),
      contactEmail: clean(formData.get('contactEmail')) ?? '',
      contactPhone: clean(formData.get('contactPhone')),
      retainerType: clean(formData.get('retainerType')),
      contractStart: clean(formData.get('contractStart')),
      contractEnd: clean(formData.get('contractEnd')),
      driveFolderUrl: clean(formData.get('driveFolderUrl')) ?? '',
      brandKitUrl: clean(formData.get('brandKitUrl')) ?? '',
      websiteUrl: clean(formData.get('websiteUrl')) ?? '',
      internalNotes: clean(formData.get('internalNotes')),
    };

    const validated = ClientSchema.parse(raw);

    const before = await prisma.client.findUnique({ where: { id: clientId } });

    await prisma.client.update({
      where: { id: clientId },
      data: {
        name: validated.name,
        industry: validated.industry ?? null,
        logoUrl: validated.logoUrl ?? before?.logoUrl ?? null,
        contactName: validated.contactName ?? null,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone ?? null,
        retainerType: validated.retainerType ?? null,
        contractStart: validated.contractStart ? new Date(validated.contractStart) : null,
        contractEnd: validated.contractEnd ? new Date(validated.contractEnd) : null,
        driveFolderUrl: validated.driveFolderUrl || null,
        brandKitUrl: validated.brandKitUrl || null,
        websiteUrl: validated.websiteUrl || null,
        internalNotes: validated.internalNotes ?? null,
      },
    });

    await writeActivityLog({
      entityType: 'client',
      entityId: clientId,
      actorId: session.user.id,
      action: 'client.updated',
      clientId,
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/clients');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Validation failed' };
    }
    console.error('[updateClient]', error);
    return { success: false, error: 'Failed to update client' };
  }
}

export async function deleteClient(clientId: string): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);

    await prisma.client.delete({ where: { id: clientId } });

    await writeActivityLog({
      entityType: 'client',
      entityId: clientId,
      actorId: session.user.id,
      action: 'client.deleted',
    });

    revalidatePath('/clients');

    return { success: true };
  } catch (error) {
    console.error('[deleteClient]', error);
    return { success: false, error: 'Failed to delete client' };
  }
}

export async function updateClientHealth(
  clientId: string,
  healthStatus: HealthStatus
): Promise<ActionResult> {
  try {
    const session = await withRole(['manager', 'super_admin']);

    await prisma.client.update({
      where: { id: clientId },
      data: { healthStatus },
    });

    await writeActivityLog({
      entityType: 'client',
      entityId: clientId,
      actorId: session.user.id,
      action: 'client.health_updated',
      clientId,
      diff: { healthStatus },
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath('/clients');

    return { success: true };
  } catch (error) {
    console.error('[updateClientHealth]', error);
    return { success: false, error: 'Failed to update health status' };
  }
}