// features/auth/lib/login-validation.ts
// Shared validate + sanitize dùng chung cho admin-login và client-login.
// Chạy trong Server Action (server-side only).

// ─── Constants ───────────────────────────────────────────────────────────────

/** RFC 5321: max length of email address */
const EMAIL_MAX_LENGTH = 254;

/** Reasonable upper bound to prevent DoS via huge payload */
const PASSWORD_MAX_LENGTH = 128;

/** Minimum password length enforced on the client side */
const PASSWORD_MIN_LENGTH = 6;

/**
 * Simple but robust email regex:
 * - local part: printable non-whitespace chars (no @)
 * - @
 * - domain: labels separated by dots, each label 1–63 chars
 * - TLD: at least 2 chars
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FieldErrors {
  email?: string;
  password?: string;
}

export interface LoginValidationResult {
  /** Field-level errors (hiển thị dưới từng input) */
  fieldErrors?: FieldErrors;
  /** true nếu không có lỗi */
  valid: boolean;
}

// ─── Sanitize ────────────────────────────────────────────────────────────────

/**
 * Loại bỏ các ký tự nguy hiểm HTML/JS khỏi chuỗi.
 * Dùng để sanitize email trước khi prefill vào input (chống Reflected XSS).
 */
export function sanitizeText(raw: string): string {
  return raw
    .replace(/&/g, "")
    .replace(/</g, "")
    .replace(/>/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .replace(/`/g, "")
    .replace(/\//g, "");
}

// ─── Open Redirect protection ────────────────────────────────────────────────

/**
 * Chỉ cho phép relative URL an toàn.
 * - Phải bắt đầu bằng "/"
 * - Không được bắt đầu bằng "//" (protocol-relative → redirect ra ngoài)
 * - Không được chứa protocol (http://, https://, javascript:...)
 * - Nếu không hợp lệ → trả về fallbackUrl
 */
export function validateRedirectTo(
  redirectTo: string | null | undefined,
  fallbackUrl: string
): string {
  if (!redirectTo || typeof redirectTo !== "string") return fallbackUrl;

  const trimmed = redirectTo.trim();

  // Phải là relative path
  if (!trimmed.startsWith("/")) return fallbackUrl;

  // Chặn protocol-relative URL (//evil.com)
  if (trimmed.startsWith("//")) return fallbackUrl;

  // Chặn bất kỳ protocol nào nhúng trong path
  if (/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return fallbackUrl;

  // Giới hạn độ dài
  if (trimmed.length > 500) return fallbackUrl;

  return trimmed;
}

// ─── Field-level validation ──────────────────────────────────────────────────

/**
 * Validate email + password cho login form.
 * Trả về field-level errors (nếu có) và flag `valid`.
 *
 * @param email    Giá trị đã trim từ FormData
 * @param password Giá trị raw từ FormData (KHÔNG trim — space có thể là mật khẩu cố ý)
 */
export function validateLoginInput(
  email: string,
  password: string
): LoginValidationResult {
  const errors: FieldErrors = {};

  // ── Email ──────────────────────────────────────────────────────────────────
  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = "Email quá dài (tối đa 254 ký tự)";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Email không đúng định dạng";
  }

  // ── Password ───────────────────────────────────────────────────────────────
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = "Mật khẩu quá dài (tối đa 128 ký tự)";
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    valid: !hasErrors,
    fieldErrors: hasErrors ? errors : undefined,
  };
}
