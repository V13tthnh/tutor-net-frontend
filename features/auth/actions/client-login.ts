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
import { headers, cookies } from "next/headers";
import { getSecurityFlagsFromCookies } from "@/lib/security-sandbox";

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
  captchaFallback?: boolean;
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

  // ── reCAPTCHA Verification ────────────────────────────────────────────────
  const recaptchaV3Token = (formData.get("recaptchaV3Token") as string) ?? "";
  const recaptchaV2Token = (formData.get("recaptchaV2Token") as string) ?? "";

  async function verifyRecaptcha(
    token: string,
    secretKey: string
  ): Promise<{ success: boolean; score?: number }> {
    if (!token) return { success: false };

    // FIX Bug 3: Mock token dành cho môi trường offline/dev — bypass Google API
    // "mock-v3-token" do getFreshV3Token() trả về khi grecaptcha chưa load
    // "mock-v2-token" do useMockCheckbox trả về khi script Google không load được
    if (token === "mock-v3-token" || token === "mock-v2-token") {
      return { success: true, score: 0.9 };
    }

    try {
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${secretKey}&response=${token}`,
      });
      const data = await response.json();
      return {
        success: data.success,
        score: data.score,
      };
    } catch (e) {
      console.error("reCAPTCHA connection error:", e);
      // Fallback khi mất kết nối internet (local environment)
      return { success: true, score: 0.9 };
    }
  }

  const isBotSimulated = email.toLowerCase().startsWith("bot@");

  if (recaptchaV2Token) {
    // V2 token có mặt → user đã hoàn thành challenge v2
    const v2Secret = process.env.RECAPTCHA_V2_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnP645szI7Sgmu7bI1tS';
    const v2Result = await verifyRecaptcha(recaptchaV2Token, v2Secret);
    if (!v2Result.success) {
      return {
        error: "Xác minh CAPTCHA thất bại. Vui lòng thử lại.",
        email: emailSafe,
        captchaFallback: true,
      };
    }
  } else {
    // Không có v2 token → kiểm tra v3
    const v3Secret = process.env.RECAPTCHA_V3_SECRET_KEY || '6Ldt4Q4TAAAAAGG-vFI1TnP645szI7Sgmu7bI1tS';
    const v3Result = await verifyRecaptcha(recaptchaV3Token, v3Secret);
    const score = v3Result.score !== undefined ? v3Result.score : 0.9;

    if (!v3Result.success || score < 0.5 || isBotSimulated) {
      // Score thấp hoặc bot simulate → yêu cầu v2 challenge
      return {
        error: "Vui lòng hoàn thành kiểm tra CAPTCHA bên dưới.",
        email: emailSafe,
        captchaFallback: true,
      };
    }
  }

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const flags = getSecurityFlagsFromCookies(cookieStore);
  const isBruteForceActive = flags.includes('brute_force');

  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  if (!isBruteForceActive && !checkRateLimit(ip, 5, 900000)) {
    return {
      error: "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.",
      email: emailSafe,
    };
  }

  // ── Validate redirectTo — chặn Open Redirect ──────────────────────────────
  const redirectTo = validateRedirectTo(rawRedirect, "/");

  // ── Validate field-level ──────────────────────────────────────────────────
  const isBypassLoginActive = flags.includes('bypass_login');

  if (!isBypassLoginActive) {
    const validation = validateLoginInput(email, password);
    if (!validation.valid) {
      return {
        fieldErrors: validation.fieldErrors,
        email: emailSafe,
      };
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  try {
    const session = await loginClientService({ email, password });

    // Sync with backend if session fixation sandbox flag is active
    if (flags.includes('session_fixation')) {
      const tsCookie = cookieStore.get("TUTOR_SESSION")?.value;
      if (tsCookie) {
        try {
          const backendBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080/api/v1").replace(/\/api\/v1$/, '');
          await fetch(`${backendBase}/api/v1/demo/session/login/vulnerable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `TUTOR_SESSION=${tsCookie}`
            },
            body: JSON.stringify({ email: session.user.email })
          });
        } catch (e) {
          console.error("Failed to sync fixation session with backend", e);
        }
      }
    }

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