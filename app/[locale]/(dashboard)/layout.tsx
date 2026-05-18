import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SearchOverlay from '@/components/search/SearchOverlay';
import PageTransition from '@/components/layout/PageTransition';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [session, maintenanceSetting] = await Promise.all([
    auth(),
    prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } }).catch(() => null),
  ]);
  const maintenanceMode = maintenanceSetting?.value === 'true';
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role,
    image: session.user.image ?? null,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} locale={locale} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {maintenanceMode && (
          <div style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--warning)' }}>
              ⚠️ Maintenance mode is active — only super admins can see this banner.
            </span>
          </div>
        )}
        <Topbar user={user} />
        <SearchOverlay />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          background: 'var(--bg)',
        }}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}