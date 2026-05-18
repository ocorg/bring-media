'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { pusherServer } from '@/lib/pusher/server';
import { requireAuth } from '@/lib/auth/session';
import type { NotificationType, Prisma } from '@prisma/client';

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export interface NotificationPayload {
  title: string;
  body: string;
  projectId?: string;
  actorName?: string;
}

// ─── Create (called internally from other actions) ────────────────────────────

export async function createNotification(data: {
  recipientId: string;
  type: NotificationType;
  taskId?: string;
  payload: NotificationPayload;
}): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        type: data.type,
        taskId: data.taskId ?? null,
        payload: data.payload as unknown as Prisma.InputJsonValue,
      },
    });

    // Pusher fires AFTER DB write
    await pusherServer.trigger(
      `private-user-${data.recipientId}`,
      'notification.new',
      {
        id: notification.id,
        type: notification.type,
        payload: data.payload,
        isRead: false,
        createdAt: notification.createdAt.toISOString(),
      }
    );
  } catch (error) {
    // Never crash the caller — notifications are best-effort
    console.error('[createNotification]', error);
  }
}

// ─── Mark single read ─────────────────────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { id, recipientId: session.user.id },
      data: { isRead: true },
    });
    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('[markNotificationRead]', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

// ─── Mark all read ────────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('[markAllNotificationsRead]', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}