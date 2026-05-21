import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import TeamManager from '@/components/settings/TeamManager';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role === 'team_member') redirect('/projects');

  const isSuperAdmin = session.user.role === 'super_admin';

  const [members, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, isHidden: true, isActive: true },
      // Managers cannot see ghost users — only super_admin can
      where: isSuperAdmin ? {} : { isHidden: false },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <TeamManager
      initialMembers={members}
      initialInvites={pendingInvites}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}