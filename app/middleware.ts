import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_CONFIG } from '@/features/auth/lib/auth.config';
import { getSessionFromCookies, hasAdminRole } from '@/features/auth/lib/auth.utils';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = getSessionFromCookies(request.cookies, 'admin');
    if (!session || !hasAdminRole(session.user)) {
      const loginUrl = new URL(AUTH_CONFIG.ROUTES.ADMIN.LOGIN, request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/account')) {
    const session = getSessionFromCookies(request.cookies, 'client');
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
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
  matcher: ['/admin/:path*', '/account/:path*']
};