import { NextRequest, NextResponse } from 'next/server';
import { verifyInviteToken } from '@/lib/utils/tokens';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const payload = await verifyInviteToken(token);
  if (!payload) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: payload.email });
}