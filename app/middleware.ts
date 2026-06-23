import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_CONFIG } from '@/features/auth/lib/auth.config';
import { getSessionFromCookies, hasAdminRole } from '@/features/auth/lib/auth.utils';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static assets or files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Check admin access to admin portal
  if (pathname.startsWith('/admin')) {
    const session = getSessionFromCookies(request.cookies, 'admin');
    if (!session || !hasAdminRole(session.user)) {
      const loginUrl = new URL(AUTH_CONFIG.ROUTES.ADMIN.LOGIN, request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Check client account access
  if (pathname.startsWith('/account')) {
    const session = getSessionFromCookies(request.cookies, 'client');
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. If logged in as admin/super_admin and trying to access client pages, redirect to admin dashboard
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/auth/admin') &&
    !pathname.startsWith('/api')
  ) {
    const adminSession = getSessionFromCookies(request.cookies, 'admin');
    if (adminSession && hasAdminRole(adminSession.user)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};