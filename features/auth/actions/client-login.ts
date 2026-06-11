"use server";

import { loginClientService } from "../api/service";
import { setClientSession } from "../lib/session.server";

// ─── State ────────────────────────────────────────────────────────────────────

export interface ClientLoginState {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  /** Giữ lại email để prefill input khi lỗi */
  email?: string;
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Server Action cho trang đăng nhập client (tutor / student).
 *
 * Flow:
 * 1. Validate input
 * 2. Gọi POST /auth/login
 * 3. Serialize session → lưu vào HttpOnly cookie "client_session"
 * 4. Trả về { success: true, redirectTo } để client redirect
 */
export async function clientLoginAction(
  _prev: ClientLoginState,
  formData: FormData
): Promise<ClientLoginState> {
  const email    = (formData.get("email")      as string)?.trim() ?? "";
  const password = (formData.get("password")   as string)         ?? "";

  // Đọc redirectTo từ hidden input hoặc fallback về /
  const redirectTo =
    (formData.get("redirectTo") as string)?.trim() || "/";

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!email) return { error: "Vui lòng nhập email.", email };
  if (!password) return { error: "Vui lòng nhập mật khẩu.", email };

  // ── Login ─────────────────────────────────────────────────────────────────
  try {
    const session = await loginClientService({ email, password });

    // Lưu session vào HttpOnly cookie (path: "/", dùng cho toàn bộ app)
    await setClientSession(session);

    return {
      success: true,
      redirectTo,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.",
      email,
    };
  }
}