import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_SEGMENTS = [
  'dashboard', 'clients', 'projects', 'calendar',
  'workload', 'notifications', 'settings', 'admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch API routes — let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/');
  const segmentAfterLocale = segments[2];
  const isProtected = PROTECTED_SEGMENTS.includes(segmentAfterLocale);

  if (isProtected) {
    const session = await auth();
    if (!session?.user) {
      const locale = segments[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    if (segmentAfterLocale === 'admin' && session.user.role !== 'super_admin') {
      const locale = segments[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};