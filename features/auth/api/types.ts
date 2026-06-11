// HTTP contract types — map 1-1 với DTO của backend
// Không chứa logic

// ─── Requests ────────────────────────────────────────────────────────────────

/** POST /auth/register */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

/** POST /auth/login  |  POST /auth/admin/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/refresh */
export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

/** Embedded trong AuthResponse */
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
}

/**
 * POST /auth/register
 * POST /auth/login
 * POST /auth/admin/login
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number; // giây
  user: UserResponse;
}

/**
 * POST /auth/refresh
 * (TokenResponse — chỉ trả token, không kèm user)
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * GET /auth/me
 * (UserResponse độc lập)
 */
export type MeResponse = UserResponse;

// ─── Error response từ backend ───────────────────────────────────────────────

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

/** POST /auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** POST /auth/reset-password */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}