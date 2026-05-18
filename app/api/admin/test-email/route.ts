import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { sendEmail } from '@/lib/email/smtp';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { to } = await req.json() as { to: string };
  try {
    await sendEmail({
      to,
      subject: 'BRING Media Terminal — Email test',
      html: `<p style="font-family:sans-serif;color:#333">✅ SMTP is working correctly. Sent from <strong>BRING Media Terminal</strong>.</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}