"use server";

import { loginClientService } from "../api/service";
import { setClientSession } from "../lib/session.server";
import {
  validateLoginInput,
  validateRedirectTo,
  sanitizeText,
  type FieldErrors,
} from "../lib/login-validation";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";

// ─── State ────────────────────────────────────────────────────────────────────

export interface ClientLoginState {
  /** Lỗi chung: lỗi API (401, 500...) — hiển thị dạng banner */
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
 * Server Action cho trang đăng nhập client (tutor / student).
 *
 * Flow:
 * 1. Validate input → trả fieldErrors nếu sai format/rỗng
 * 2. Validate redirectTo chống Open Redirect
 * 3. Gọi POST /auth/login
 * 4. Serialize session → lưu vào HttpOnly cookie "client_session"
 * 5. Trả về { success: true, redirectTo } để client redirect
 */
export async function clientLoginAction(
  _prev: ClientLoginState,
  formData: FormData
): Promise<ClientLoginState> {
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
  const redirectTo = validateRedirectTo(rawRedirect, "/");

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
    const session = await loginClientService({ email, password });

    // Lưu session vào HttpOnly cookie (path: "/", dùng cho toàn bộ app)
    await setClientSession(session);

    return {
      success: true,
      redirectTo,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Đăng nhập không thành công vui lòng thử lại",
      email: emailSafe,
    };
  }
}