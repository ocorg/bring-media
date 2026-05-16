import { auth } from '@/lib/auth/auth';
import type { Role } from '@prisma/client';

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

export async function withRole(allowedRoles: Role[]) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}