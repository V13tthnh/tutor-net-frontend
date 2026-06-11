import { AUTH_CONFIG } from '@/features/auth/lib/auth.config';

function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: route qua proxy handler app/api/[...path]/route.ts để inject token
    return `/api/v1${endpoint}`;
  }
  // Server-side: gọi thẳng đến backend với token từ cookie
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
  return `${backendUrl}${endpoint}`;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Redirect to admin login when session expires on the client side.
 * Preserves the current path so the user is sent back after login.
 */
function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const loginPath = AUTH_CONFIG.ROUTES.ADMIN.LOGIN;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `${loginPath}?next=${next}&reason=expired`;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(endpoint);

  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options?.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.assign(headers, customHeaders);
  }

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      // Automatically attach Authorization Bearer token for direct server-side calls
      const { headers: nextHeaders } = await import('next/headers');
      const headerStore = await nextHeaders();
      const referer = headerStore.get('referer');
      const isAdminContext = endpoint.startsWith('/admin') || 
        !!(referer && (referer.includes('/admin') || referer.includes('/auth/admin')));

      const adminAccessToken = cookieStore.get('admin_access_token')?.value;
      const clientAccessToken = cookieStore.get('client_access_token')?.value;
      
      const accessToken = isAdminContext ? adminAccessToken : clientAccessToken;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    } catch (e) {
      // Ignore errors when headers/cookies are not available (e.g. static generation)
    }
  }

  const signal = options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal
    });

    // ── Handle 401/403: session expired vs access denied ──────────────────────
    // The proxy already attempted a token refresh. If we get 401 or 403 with expired=true,
    // it means the refresh token is also expired → force the user to log in again.
    if (res.status === 401 || res.status === 403) {
      let body: any = {};
      try { body = await res.json(); } catch { }

      if (body?.expired === true) {
        // Only auto-redirect on the client side; server-side let it throw normally
        if (typeof window !== 'undefined') {
          redirectToLogin();
          // Return a never-resolving promise so callers don't see a partial error state
          return new Promise<T>(() => { });
        }
        throw new Error(body?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // Regular 401/403 (e.g. Access Denied from method security) → throw to be caught by form/mutations
      throw new Error(body?.message || 'Bạn không có quyền thực hiện thao tác này');
    }

    if (!res.ok) {
      // Try to extract a meaningful error message from the JSON body
      let errorMessage = `API error: ${res.status} ${res.statusText} at ${url}`;
      try {
        const body = await res.json();
        if (body?.message) errorMessage = body.message;
      } catch { }
      throw new Error(errorMessage);
    }

    // 204 No Content và 205 Reset Content không có body — không gọi .json()
    if (res.status === 204 || res.status === 205) {
      return null as T;
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      throw new Error(`Kết nối tới API quá hạn (timeout ${DEFAULT_TIMEOUT}ms)`);
    }
    throw error;
  }
}
