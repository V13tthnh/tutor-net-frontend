import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, getClientSession } from '@/features/auth/lib/session.server';
import { refreshSessionService } from '@/features/auth/api/service';
import { signUserCookie } from '@/features/auth/lib/auth.utils';

export const dynamic = 'force-dynamic';

async function proxyRequest(
  targetUrl: URL,
  method: string,
  headers: Headers,
  body: any
): Promise<Response> {
  return fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    cache: 'no-store'
  });
}

function isSafePath(pathStr: string): boolean {
  if (!pathStr) return true;
  if (pathStr.length > 500) return false;
  if (pathStr.includes('..')) return false;       // path traversal
  if (pathStr.includes('\0')) return false;        // null byte
  if (/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(pathStr)) return false; // protocol injection
  return true;
}

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  let pathStr = path.join('/');

  if (!isSafePath(pathStr)) {
    return NextResponse.json(
      { success: false, message: 'Yêu cầu không hợp lệ' },
      { status: 400 }
    );
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

  // Strip 'v1/' prefix if it's already in the request path to avoid duplication
  if (pathStr.startsWith('v1/')) {
    pathStr = pathStr.substring(3);
  } else if (pathStr === 'v1') {
    pathStr = '';
  }

  const targetUrl = new URL(`${backendUrl}/${pathStr}`);
  targetUrl.search = request.nextUrl.search;

  const method = request.method;
  let body: any = undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    try {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
        const arrayBuffer = await request.arrayBuffer();
        body = new Uint8Array(arrayBuffer);
      } else {
        body = await request.text();
      }
    } catch (e) {
      // Empty or unreadable body
    }
  }

  // ─── Determine session and whether this is an admin or client request ─────
  const referer = request.headers.get('referer');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/api/v1/admin') ||
    (request.nextUrl.pathname.startsWith('/api/v1') && pathStr.startsWith('admin')) ||
    !!(referer && (referer.includes('/admin') || referer.includes('/auth/admin')));

  const isAdmin = isAdminRoute;
  let session = isAdmin ? await getServerSession() : await getClientSession();

  // Fallback to the other session if access token is missing in the primary session
  if (!session?.accessToken) {
    if (isAdmin) {
      const fallback = await getClientSession();
      if (fallback?.accessToken) {
        session = fallback;
      }
    }
  }

  // ─── Build headers helper ─────────────────────────────────────────────────
  function buildHeaders(accessToken?: string): Headers {
    const headers = new Headers();
    let contentType = request.headers.get('content-type');
    if (contentType) {
      if (contentType.includes('multipart/form-data')) {
        contentType = contentType.replace(/;\s*charset=[\w-]+/gi, '');
      }
      headers.set('Content-Type', contentType);
    } else {
      headers.set('Content-Type', 'application/json');
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    // Forward non-sensitive headers from the incoming request
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'cookie', 'authorization', 'content-type', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
        headers.set(key, value);
      }
    });
    return headers;
  }

  // ─── First attempt ────────────────────────────────────────────────────────
  let res: Response;
  try {
    res = await proxyRequest(targetUrl, method, buildHeaders(session?.accessToken), body);
  } catch (error: any) {
    console.error(`[Proxy Connection Error] Failed to fetch ${targetUrl.toString()}:`, error.message || error);
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể kết nối tới máy chủ API backend. Vui lòng đảm bảo máy chủ đang hoạt động.'
      },
      { status: 503 }
    );
  }

  let refreshedSession: any = null;
  let refreshFailed = false;

  // ─── Handle 401 / 403: try silent token refresh, then retry once ─────────
  if ((res.status === 401 || res.status === 403) && session?.refreshToken) {
    try {
      const newSession = await refreshSessionService(session);
      refreshedSession = newSession;
      // Retry the original request with the new token
      res = await proxyRequest(targetUrl, method, buildHeaders(newSession.accessToken), body);
    } catch (refreshError: any) {
      if (refreshError?.name === 'TypeError' || refreshError?.message?.includes('fetch failed')) {
        console.error('[Proxy] Failed to connect to backend during token refresh:', refreshError);
        return NextResponse.json(
          {
            success: false,
            message: 'Không thể kết nối tới máy chủ API backend để làm mới phiên đăng nhập.'
          },
          { status: 503 }
        );
      }
      refreshFailed = true;
      // Refresh failed — cookies will be cleared on the 401 errorResponse below
      console.warn('[Proxy] Token refresh failed:', refreshError);
    }
  }

  // Helper function to set cookies directly on response
  function applySessionCookies(response: NextResponse, sessionObj: any) {
    const prefix = isAdmin ? 'admin' : 'client';
    const BASE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    if (sessionObj.accessToken) {
      const maxAge = Math.max(0, Math.floor((sessionObj.expiresAt - Date.now()) / 1_000));
      response.cookies.set(`${prefix}_access_token`, sessionObj.accessToken, {
        ...BASE_OPTIONS,
        maxAge,
      });
    } else {
      response.cookies.delete(`${prefix}_access_token`);
    }

    response.cookies.set(`${prefix}_refresh_token`, sessionObj.refreshToken, {
      ...BASE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60,
    });

    const userRaw = Buffer.from(JSON.stringify(sessionObj.user)).toString('base64');
    const userSigned = signUserCookie(userRaw);
    response.cookies.set(`${prefix}_user`, userSigned, {
      ...BASE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60,
    });
  }

  function clearSessionCookies(response: NextResponse) {
    const prefix = isAdmin ? 'admin' : 'client';
    response.cookies.delete(`${prefix}_access_token`);
    response.cookies.delete(`${prefix}_refresh_token`);
    response.cookies.delete(`${prefix}_user`);
  }

  if (refreshFailed) {
    // Return a structured 401 that the client can detect and redirect from
    const errorResponse = NextResponse.json(
      { success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', expired: true },
      { status: 401 }
    );
    clearSessionCookies(errorResponse);
    return errorResponse;
  }

  // ─── Build the response back to the browser ───────────────────────────────
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lowerKey)) {
      responseHeaders.set(key, value);
    }
  });

  // ─── 204 / 205: No Content — trả về ngay, không đọc body ────────────────
  if (res.status === 204 || res.status === 205) {
    const response = new NextResponse(null, {
      status: res.status,
      headers: responseHeaders
    });
    if (refreshedSession) {
      applySessionCookies(response, refreshedSession);
    }
    return response;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const responseData = await res.json();
    const response = new NextResponse(JSON.stringify(responseData), {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
    if (refreshedSession) {
      applySessionCookies(response, refreshedSession);
    }
    return response;
  } else {
    const responseData = await res.arrayBuffer();
    const response = new NextResponse(responseData, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });
    if (refreshedSession) {
      applySessionCookies(response, refreshedSession);
    }
    return response;
  }
}

export {
  handleProxy as GET,
  handleProxy as POST,
  handleProxy as PUT,
  handleProxy as DELETE,
  handleProxy as PATCH,
  handleProxy as OPTIONS,
  handleProxy as HEAD
};
