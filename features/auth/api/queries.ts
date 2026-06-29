// features/auth/api/queries.ts
// Raw HTTP fetch — map 1-1 với từng endpoint của AuthController.
// Không chứa business logic, không redirect, không đọc/ghi cookie.

import { AUTH_CONFIG } from "../lib/auth.config";
import type {
  ApiErrorResponse,
  AuthResponse,
  LoginRequest,
  MeResponse,
  RefreshTokenRequest,
  RegisterRequest,
  TokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "./types";

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

// ─── Internal helper ─────────────────────────────────────────────────────────

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ.",
  401: "Email hoặc mật khẩu không đúng.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy tài nguyên.",
  409: "Email đã được sử dụng.",
  422: "Dữ liệu không hợp lệ.",
  429: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Lỗi máy chủ. Vui lòng thử lại sau.",
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  const body: ApiErrorResponse = await res.json().catch(() => ({}));
  const message =
    body.message ??
    HTTP_ERROR_MESSAGES[res.status] ??
    "Đã xảy ra lỗi. Vui lòng thử lại.";

  throw new ApiHttpError(res.status, message, body);
}

async function jsonPost(url: string, payload: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const sandboxCookie = cookieStore.get("security_sandbox")?.value;
      if (sandboxCookie) {
        headers["Cookie"] = `security_sandbox=${sandboxCookie}`;
      }
    } catch (e) {
      // Ignore if cookies are not available
    }
  }

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Đăng ký tài khoản client mới.
 */
export async function queryRegister(
  payload: RegisterRequest
): Promise<AuthResponse> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.REGISTER}`,
    payload
  );
  return handleResponse<AuthResponse>(res);
}

/**
 * POST /auth/login
 * Đăng nhập tài khoản client (tutor / student).
 */
export async function queryClientLogin(
  payload: LoginRequest
): Promise<AuthResponse> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.CLIENT_LOGIN}`,
    payload
  );
  return handleResponse<AuthResponse>(res);
}

/**
 * POST /auth/admin/login
 * Đăng nhập tài khoản quản trị (admin / super_admin).
 */
export async function queryAdminLogin(
  payload: LoginRequest
): Promise<AuthResponse> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.ADMIN_LOGIN}`,
    payload
  );
  return handleResponse<AuthResponse>(res);
}

/**
 * GET /auth/me
 * Lấy thông tin người dùng hiện tại (cần Bearer token).
 */
export async function queryGetMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.ME}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(accessToken),
      },
      cache: "no-store",
    }
  );
  return handleResponse<MeResponse>(res);
}

/**
 * POST /auth/refresh
 * Làm mới access token bằng refresh token.
 * Trả về TokenResponse (không kèm user).
 */
export async function queryRefreshToken(
  payload: RefreshTokenRequest
): Promise<TokenResponse> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
    payload
  );
  return handleResponse<TokenResponse>(res);
}

/**
 * POST /auth/logout
 * Đăng xuất và blacklist access token hiện tại.
 * Backend nhận token qua Authorization header.
 */
export async function queryLogout(accessToken: string): Promise<void> {
  const res = await fetch(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.LOGOUT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(accessToken),
      },
      cache: "no-store",
    }
  );
  // 200 OK hoặc 400 (token không hợp lệ) — cả hai đều chấp nhận ở client
  if (!res.ok && res.status !== 400) {
    await handleResponse<never>(res);
  }
}

/**
 * POST /auth/forgot-password
 * Yêu cầu gửi link đặt lại mật khẩu.
 */
export async function queryForgotPassword(
  payload: ForgotPasswordRequest
): Promise<{ message: string }> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.FORGOT_PASSWORD}`,
    payload
  );
  return handleResponse<{ message: string }>(res);
}

/**
 * POST /auth/reset-password
 * Thực hiện đặt lại mật khẩu bằng token.
 */
export async function queryResetPassword(
  payload: ResetPasswordRequest
): Promise<{ message: string }> {
  const res = await jsonPost(
    `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.ENDPOINTS.RESET_PASSWORD}`,
    payload
  );
  return handleResponse<{ message: string }>(res);
}