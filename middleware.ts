import createMiddleware from 'next-intl/middleware';
import { auth } from '@/lib/auth/auth';
import { routing } from '@/lib/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_SEGMENTS = [
  'dashboard',
  'clients',
  'projects',
  'calendar',
  'workload',
  'notifications',
  'settings',
  'admin',
];

export default auth(function middleware(req: import('next-auth').NextAuthRequest) {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split('/');
  const segmentAfterLocale = segments[2];

  const isProtected = PROTECTED_SEGMENTS.includes(segmentAfterLocale);

  if (isProtected) {
    if (!req.auth?.user) {
      const locale = segments[1] || 'en';
      return NextResponse.redirect(
        new URL(`/${locale}/login`, req.url)
      );
    }

    if (
      segmentAfterLocale === 'admin' &&
      req.auth.user.role !== 'super_admin'
    ) {
      const locale = segments[1] || 'en';
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, req.url)
      );
    }
  }

  return handleI18nRouting(req as NextRequest);
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};