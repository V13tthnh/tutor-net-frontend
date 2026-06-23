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
      // 1. Gọi backend refresh token để lấy access token mới (được ký với roles/permissions mới trong DB)
      const { refreshSessionService } = await import('@/features/auth/api/service');
      const newSession = await refreshSessionService(session);
      if (newSession && newSession.accessToken) {
        // 2. Lấy thông tin user tươi mới nhất từ backend bằng token mới
        const freshUser = await queryGetMe(newSession.accessToken) as any;
        const freshUserData = freshUser?.data || freshUser;
        if (freshUserData) {
          newSession.user = {
            ...newSession.user,
            fullName: freshUserData.fullName || newSession.user.fullName,
            avatarUrl: freshUserData.avatarUrl !== undefined ? freshUserData.avatarUrl : newSession.user.avatarUrl,
            roles: freshUserData.roles || newSession.user.roles,
            permissions: freshUserData.permissions || newSession.user.permissions,
          };
        }
        
        // 3. Ghi đè session mới vào cookies (accessToken mới + User roles mới)
        if (isAdminRequest) {
          await setServerSession(newSession);
        } else {
          await setClientSession(newSession);
        }
        session = newSession;
        user = newSession.user;
      }
    } catch (e) {
      console.error('Failed to refresh session from backend:', e);
      // Fallback: nếu gọi refresh token thất bại, thử lấy user info bằng token hiện tại
      try {
        const res = await queryGetMe(session.accessToken) as any;
        const freshUser = res?.data || res;
        if (freshUser) {
          session.user = {
            ...session.user,
            fullName: freshUser.fullName || session.user.fullName,
            avatarUrl: freshUser.avatarUrl !== undefined ? freshUser.avatarUrl : session.user.avatarUrl,
          };
          user = session.user;
        }
      } catch (innerErr) {
        console.error('Failed fallback queryGetMe:', innerErr);
      }
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
