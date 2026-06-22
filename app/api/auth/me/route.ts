import { NextResponse } from 'next/server';
import { getClientSession, setClientSession, getServerSession, setServerSession } from '@/features/auth/lib/session.server';
import { queryGetMe } from '@/features/auth/api/queries';
import { getAvatarUrl } from '@/lib/utils';
import { signUserCookie } from '@/features/auth/lib/auth.utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const portal = searchParams.get('portal');
  const referer = request.headers.get('referer');

  const isAdminRequest = portal === 'admin' ||
    !!(referer && (referer.includes('/admin') || referer.includes('/auth/admin')));

  let session = isAdminRequest ? await getServerSession() : await getClientSession();
  let isAdmin = !!(session && isAdminRequest);

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (!session) {
    return NextResponse.json({ user: null }, { headers });
  }

  const refresh = searchParams.get('refresh') === 'true';

  let user = session.user;

  if (refresh && session.accessToken) {
    try {
      const res = await queryGetMe(session.accessToken) as any;
      // Trích xuất từ res.data nếu có wrapper data, nếu không thì lấy trực tiếp từ res
      const freshUser = res?.data || res;
      if (freshUser) {
        // Cập nhật thông tin mới nhất vào session
        session.user = {
          ...session.user,
          fullName: freshUser.fullName || session.user.fullName,
          avatarUrl: freshUser.avatarUrl !== undefined ? freshUser.avatarUrl : session.user.avatarUrl,
        };
        user = session.user;
      }
    } catch (e) {
      console.error('Failed to refresh session from backend:', e);
    }
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: getAvatarUrl(user.avatarUrl) ?? null,
      role: user.roles[0] || 'student',
      roles: user.roles,
      permissions: user.permissions
    }
  }, { headers });

  if (refresh && session) {
    const prefix = isAdmin ? 'admin' : 'client';
    const BASE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    const userRaw = Buffer.from(JSON.stringify(session.user)).toString('base64');
    const userSigned = signUserCookie(userRaw);
    response.cookies.set(`${prefix}_user`, userSigned, {
      ...BASE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  return response;
}
