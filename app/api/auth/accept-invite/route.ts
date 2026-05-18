import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyInviteToken } from '@/lib/utils/tokens';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json() as {
      token: string;
      name: string;
      password: string;
    };

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'token, name, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const payload = await verifyInviteToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: payload.invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 409 });
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Check email not already taken
    const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email: invitation.email,
          name: name.trim(),
          password: hashedPassword,
          role: invitation.role,
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, email: invitation.email });
  } catch (error) {
    console.error('[accept-invite]', error);
    return NextResponse.json({ error: 'Failed to activate account' }, { status: 500 });
  }
}