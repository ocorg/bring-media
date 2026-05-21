import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json() as {
      name?: string;
      email?: string;
      isActive?: boolean;
      isHidden?: boolean;
    };

    const callerRole = session.user.role;
    const callerId = session.user.id;

    // Managers and above only
    if (callerRole === 'team_member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch target user to enforce role-based restrictions
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // name + email: super_admin can update anyone; manager can only update team_members
    if (body.name !== undefined || body.email !== undefined) {
      const canEdit =
        callerRole === 'super_admin' ||
        (callerRole === 'manager' && targetUser.role === 'team_member');
      if (!canEdit) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    }

    // isActive: super_admin or manager (team_members only); cannot self-deactivate
    if (body.isActive !== undefined) {
      if (userId === callerId) {
        return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
      }
      const canToggle =
        callerRole === 'super_admin' ||
        (callerRole === 'manager' && targetUser.role === 'team_member');
      if (!canToggle) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      updateData.isActive = body.isActive;
    }

    // isHidden: super_admin only
    if (body.isHidden !== undefined) {
      if (callerRole !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      updateData.isHidden = body.isHidden;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[user-update]', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}