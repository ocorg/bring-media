import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.INVITE_TOKEN_SECRET!);

export interface InviteTokenPayload {
  email: string;
  invitedById: string;
  invitationId: string;
}

export async function signInviteToken(payload: InviteTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('48h')
    .setIssuedAt()
    .sign(secret());
}

export async function verifyInviteToken(
  token: string
): Promise<InviteTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as InviteTokenPayload;
  } catch {
    return null;
  }
}