import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import SettingsSubNav from '@/components/settings/SettingsSubNav';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const canManageTemplates =
    session.user.role === 'manager' || session.user.role === 'super_admin';

  return (
    <div>
      <SettingsSubNav canManageTemplates={canManageTemplates} />
      <div style={{ marginTop: '1.5rem' }}>{children}</div>
    </div>
  );
}