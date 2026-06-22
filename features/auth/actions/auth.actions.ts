"use server";

import { redirect } from "next/navigation";
import {
  logoutService,
  registerService,
  refreshSessionService,
  forgotPasswordService,
  resetPasswordService,
} from "../api/service";
import {
  clearClientSession,
  clearServerSession,
  getClientSession,
  getServerSession,
  setClientSession,
  setServerSession,
} from "../lib/session.server";
import { AUTH_CONFIG } from "../lib/auth.config";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";
export interface ActionState {
  error?: string;
  success?: boolean;
  redirectTo?: string;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const fullName = (formData.get("fullName") as string)?.trim() ?? "";

  if (!email || !password || !fullName) {
    return { error: "Vui lòng điền đầy đủ thông tin." };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }

  try {
    const session = await registerService({ email, password, fullName });
    await setClientSession(session);
    return { success: true, redirectTo: "/dashboard" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Đăng ký thất bại." };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/** Đăng xuất admin */
export async function adminLogoutAction(): Promise<void> {
  const session = await getServerSession();
  if (session?.accessToken) await logoutService(session.accessToken);
  await clearServerSession();
  redirect(AUTH_CONFIG.ROUTES.ADMIN.LOGIN);
}

/** Đăng xuất client */
export async function clientLogoutAction(): Promise<void> {
  const session = await getClientSession();
  if (session?.accessToken) await logoutService(session.accessToken);
  await clearClientSession();
  redirect(AUTH_CONFIG.ROUTES.CLIENT.SIGN_IN);
}

/** @deprecated dùng adminLogoutAction hoặc clientLogoutAction */
export async function logoutAction(): Promise<void> {
  return adminLogoutAction();
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/** Làm mới session admin (gọi từ middleware hoặc Server Component) */
export async function refreshAdminSessionAction(): Promise<boolean> {
  const current = await getServerSession();
  if (!current) return false;
  try {
    const newSession = await refreshSessionService(current);
    await setServerSession(newSession);
    return true;
  } catch {
    await clearServerSession();
    return false;
  }
}

/** Làm mới session client */
export async function refreshClientSessionAction(): Promise<boolean> {
  const current = await getClientSession();
  if (!current) return false;
  try {
    const newSession = await refreshSessionService(current);
    await setClientSession(newSession);
    return true;
  } catch {
    await clearClientSession();
    return false;
  }
}

export interface ForgotPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
  email?: string;
}

export interface ResetPasswordState {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Action cho yêu cầu Quên mật khẩu
 */
export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string)?.trim() ?? "";

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  if (!checkRateLimit(ip, 5, 60000)) {
    return {
      error: "Quá nhiều yêu cầu gửi link khôi phục mật khẩu. Vui lòng thử lại sau 1 phút.",
      email
    };
  }

  if (!email) {
    return { error: "Vui lòng nhập email." };
  }

  try {
    await forgotPasswordService({ email });
    return {
      success: true,
      message: "Chúng tôi đã gửi link để đặt lại mật khẩu, hãy kiểm tra email của bạn",
      email
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi yêu cầu.",
      email
    };
  }
}

/**
 * Action cho việc Đặt lại mật khẩu
 */
export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = (formData.get("token") as string)?.trim() ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  if (!checkRateLimit(ip, 5, 60000)) {
    return {
      error: "Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 phút."
    };
  }

  if (!token) {
    return { error: "Token không hợp lệ hoặc thiếu." };
  }
  if (!newPassword) {
    return { error: "Vui lòng nhập mật khẩu mới." };
  }
  if (newPassword.length < 8) {
    return { error: "Mật khẩu phải từ 8 đến 100 ký tự." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu xác nhận không khớp." };
  }

  try {
    await resetPasswordService({ token, newPassword, confirmPassword });
    return {
      success: true,
      message: "Đặt lại mật khẩu thành công."
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại."
    };
  }
}