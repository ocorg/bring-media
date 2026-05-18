import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number; // 1–31
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();

  const recurringTasks = await prisma.task.findMany({
    where: { isRecurring: true },
    select: {
      id: true,
      projectId: true,
      serviceTypeId: true,
      title: true,
      description: true,
      priority: true,
      assignedToId: true,
      estimatedHours: true,
      status: true,
      createdById: true,
      recurrenceRule: true,
    },
  });

  let created = 0;
  const errors: string[] = [];

  for (const task of recurringTasks) {
    try {
      const rule = task.recurrenceRule as RecurrenceRule | null;
      if (!rule?.frequency) continue;

      let shouldCreate = false;
      if (rule.frequency === 'daily') shouldCreate = true;
      if (rule.frequency === 'weekly' && rule.dayOfWeek === dayOfWeek) shouldCreate = true;
      if (rule.frequency === 'monthly' && rule.dayOfMonth === dayOfMonth) shouldCreate = true;

      if (!shouldCreate) continue;

      await prisma.task.create({
        data: {
          projectId: task.projectId,
          serviceTypeId: task.serviceTypeId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          assignedToId: task.assignedToId,
          estimatedHours: task.estimatedHours,
          status: task.status,
          createdById: task.createdById,
          isRecurring: false,
          parentTaskId: task.id,
        },
      });
      created++;
    } catch (err) {
      errors.push(`task ${task.id}: ${err}`);
    }
  }

  return NextResponse.json({
    success: true,
    created,
    evaluated: recurringTasks.length,
    errors,
    runAt: now.toISOString(),
  });
}