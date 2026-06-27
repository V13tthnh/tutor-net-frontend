// features/auth/actions/admin-login.ts
"use server";

import { loginAdminService } from "../api/service";
import { setServerSession } from "../lib/session.server";
import { AUTH_CONFIG } from "../lib/auth.config";
import {
  validateLoginInput,
  validateRedirectTo,
  sanitizeText,
  type FieldErrors,
} from "../lib/login-validation";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";

// ─── State ────────────────────────────────────────────────────────────────────

export interface AdminLoginState {
  /** Lỗi chung: lỗi API (401, 403, 500...) — hiển thị dạng banner */
  error?: string;
  /** Lỗi field-level — hiển thị text đỏ dưới từng input */
  fieldErrors?: FieldErrors;
  success?: boolean;
  redirectTo?: string;
  /** Giữ lại email (đã sanitize) để prefill input khi lỗi */
  email?: string;
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Server Action cho trang đăng nhập admin.
 *
 * Flow:
 * 1. Validate input → trả fieldErrors nếu sai format/rỗng
 * 2. Validate redirectTo chống Open Redirect
 * 3. Gọi POST /auth/admin/login → kiểm tra role admin/super_admin
 * 4. Serialize session → lưu vào HttpOnly cookie "admin_session"
 * 5. Trả về { success: true, redirectTo } để client redirect
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
  const emailRaw = (formData.get("email") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const rawRedirect = (formData.get("redirectTo") as string) ?? "";

  // Trim email (chuẩn hoá), KHÔNG trim password
  const email = emailRaw.trim();

  // Sanitize email để prefill an toàn (chống Reflected XSS)
  const emailSafe = sanitizeText(email);

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  if (!checkRateLimit(ip, 5, 900000)) {
    return {
      error: "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.",
      email: emailSafe,
    };
  }

  // ── Validate redirectTo — chặn Open Redirect ──────────────────────────────
  const redirectTo = validateRedirectTo(rawRedirect, AUTH_CONFIG.ROUTES.ADMIN.DASHBOARD);

  // ── Validate field-level ──────────────────────────────────────────────────
  const validation = validateLoginInput(email, password);
  if (!validation.valid) {
    return {
      fieldErrors: validation.fieldErrors,
      email: emailSafe,
    };
  }

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
      error: err instanceof Error ? err.message : "Đăng nhập không thành công vui lòng thử lại",
      email: emailSafe, // prefill lại email (đã sanitize)
    };
  }
}