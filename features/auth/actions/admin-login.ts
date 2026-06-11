// features/auth/actions/admin-login.ts
"use server";

import { loginAdminService } from "../api/service";
import { setServerSession } from "../lib/session.server";
import { AUTH_CONFIG } from "../lib/auth.config";

// ─── State ────────────────────────────────────────────────────────────────────

export interface AdminLoginState {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  /** Giữ lại email để prefill input khi lỗi */
  email?: string;
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Server Action cho trang đăng nhập admin.
 *
 * Flow:
 * 1. Validate input
 * 2. Gọi POST /auth/admin/login → kiểm tra role admin/super_admin
 * 3. Serialize session → lưu vào HttpOnly cookie "admin_session"
 * 4. Trả về { success: true, redirectTo } để client redirect
 *
 * Lý do dùng client-side redirect (window.location.href) thay vì redirect():
 * - Form dùng useActionState → không thể dùng Next.js redirect() trong action
 *   vì Next.js throw NEXT_REDIRECT nội bộ, gây lỗi khi bắt bằng try/catch.
 * - Trả về redirectTo để component tự điều hướng sau khi nhận state.success.
 */
export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email    = (formData.get("email")      as string)?.trim() ?? "";
  const password = (formData.get("password")   as string)         ?? "";
  const redirectTo = (formData.get("redirectTo") as string)?.trim() || AUTH_CONFIG.ROUTES.ADMIN.DASHBOARD;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!email) return { error: "Vui lòng nhập email.", email };
  if (!password) return { error: "Vui lòng nhập mật khẩu.", email };

  // ── Login ─────────────────────────────────────────────────────────────────
  try {
    const session = await loginAdminService({ email, password });

    // Lưu session vào HttpOnly cookie (path: "/admin", chỉ gửi khi vào /admin/**)
    await setServerSession(session);

    return {
      success: true,
      redirectTo,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.",
      email, // prefill lại email
    };
  }
}