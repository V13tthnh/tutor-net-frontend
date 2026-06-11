// features/auth/api/service.ts
// Business logic layer: gọi queries → validate → transform sang domain types.
// Đây là layer duy nhất được phép import cả queries lẫn domain utils.

import {
  queryAdminLogin,
  queryClientLogin,
  queryGetMe,
  queryLogout,
  queryRefreshToken,
  queryRegister,
  queryForgotPassword,
  queryResetPassword,
} from "./queries";
import { buildSession, buildSessionFromToken, hasAdminRole } from "../lib/auth.utils";
import type { AuthSession, DomainUser } from "../types/auth.types";
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest } from "./types";

// ─── Error ────────────────────────────────────────────────────────────────────

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

// ─── Client auth ──────────────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản client mới.
 * Trả về AuthSession để tự động đăng nhập sau khi register.
 */
export async function registerService(
  payload: RegisterRequest
): Promise<AuthSession> {
  const data = await queryRegister(payload);
  return buildSession(data);
}

/**
 * Đăng nhập tài khoản client (tutor / student).
 */
export async function loginClientService(
  credentials: LoginRequest
): Promise<AuthSession> {
  const data = await queryClientLogin(credentials);
  return buildSession(data);
}

// ─── Admin auth ───────────────────────────────────────────────────────────────

/**
 * Đăng nhập admin:
 * 1. Gọi POST /auth/admin/login
 * 2. Kiểm tra role admin / super_admin
 * 3. Trả về AuthSession
 */
export async function loginAdminService(
  credentials: LoginRequest
): Promise<AuthSession> {
  const data = await queryAdminLogin(credentials);

  if (!hasAdminRole(data.user)) {
    throw new AuthServiceError(
      "Tài khoản không có quyền truy cập trang quản trị."
    );
  }

  return buildSession(data);
}

// ─── Shared ───────────────────────────────────────────────────────────────────

/**
 * Lấy thông tin user hiện tại từ server (GET /auth/me).
 */
export async function getMeService(accessToken: string): Promise<DomainUser> {
  return queryGetMe(accessToken);
}

/**
 * Làm mới session:
 * 1. Gọi POST /auth/refresh
 * 2. Merge token mới vào session cũ (giữ lại user hiện tại)
 */
export async function refreshSessionService(
  currentSession: AuthSession
): Promise<AuthSession> {
  const tokenData = await queryRefreshToken({
    refreshToken: currentSession.refreshToken,
  });
  return buildSessionFromToken(tokenData, currentSession.user);
}

/**
 * Đăng xuất:
 * 1. Gọi POST /auth/logout (blacklist token phía server)
 * 2. Không throw nếu token đã hết hạn — vẫn cần xoá session cookie
 */
export async function logoutService(accessToken: string): Promise<void> {
  try {
    await queryLogout(accessToken);
  } catch {
    // Token có thể đã hết hạn — bỏ qua lỗi, tiếp tục xoá session local
  }
}

/**
 * Gửi yêu cầu lấy lại mật khẩu.
 */
export async function forgotPasswordService(
  payload: ForgotPasswordRequest
): Promise<{ message: string }> {
  return queryForgotPassword(payload);
}

/**
 * Thực hiện đặt lại mật khẩu bằng token.
 */
export async function resetPasswordService(
  payload: ResetPasswordRequest
): Promise<{ message: string }> {
  return queryResetPassword(payload);
}