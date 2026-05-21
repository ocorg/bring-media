import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name } = await req.json() as { name: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile-update]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}