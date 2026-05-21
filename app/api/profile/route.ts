import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, email } = await req.json() as { name?: string; email?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updateData: { name: string; email?: string } = { name: name.trim() };

    // Email editing is allowed for super_admin and manager only
    const canEditEmail =
      session.user.role === 'super_admin' || session.user.role === 'manager';
    if (email?.trim() && canEditEmail) {
      updateData.email = email.trim().toLowerCase();
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile-update]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}