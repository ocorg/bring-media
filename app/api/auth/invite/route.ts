import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { signInviteToken } from '@/lib/utils/tokens';
import { sendEmail } from '@/lib/email/smtp';
import { inviteEmailHtml } from '@/lib/email/templates/invite';
import type { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'manager' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email, role: inviteRole } = body as { email: string; role: Role };

    if (!email || !inviteRole) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
    }

    // Check not already a user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Check no pending invitation
    const pending = await prisma.invitation.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pending) {
      return NextResponse.json({ error: 'A pending invitation already exists for this email' }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Create invitation with placeholder token, then update with signed JWT
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token: 'pending',
        role: inviteRole,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    const token = await signInviteToken({
      email,
      invitedById: session.user.id,
      invitationId: invitation.id,
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { token },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/accept-invite/${token}`;

    await sendEmail({
      to: email,
      subject: `You're invited to BRING Media Terminal`,
      html: inviteEmailHtml({
        inviterName: session.user.name ?? 'Your manager',
        role: inviteRole,
        acceptUrl,
      }),
    });

    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (error) {
    console.error('[invite]', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}