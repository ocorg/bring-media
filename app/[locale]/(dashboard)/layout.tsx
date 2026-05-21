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
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Run both DB checks in parallel — maintenance setting and real-time isActive status
  const [maintenanceSetting, dbUser] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } }).catch(() => null),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    }).catch(() => null),
  ]);

  // Deactivated check — uses DB value, not stale JWT
  if (!dbUser?.isActive) {
    redirect(`/${locale}/deactivated`);
  }

  // Maintenance check — super_admin bypasses entirely
  const maintenanceMode = maintenanceSetting?.value === 'true';
  if (maintenanceMode && session.user.role !== 'super_admin') {
    redirect(`/${locale}/maintenance`);
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
        {maintenanceMode && session.user.role === 'super_admin' && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            borderBottom: '1px solid rgba(245,158,11,0.25)',
            padding: '7px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: '500' }}>
              ⚠️ Maintenance mode is active — users are locked out. Only super admins can access the platform.
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