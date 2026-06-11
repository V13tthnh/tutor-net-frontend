// Domain types — dùng khắp nơi trong feature, độc lập với HTTP contract.

export type AdminRole = "admin" | "super_admin";
export type ClientRole = "student" | "tutor";
export type AppRole = AdminRole | ClientRole;

/** User đã được transform từ UserResponse */
export interface DomainUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
}

/** Session lưu trong cookie (server) hoặc memory (client) */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (ms) — thời điểm access token hết hạn */
  expiresAt: number;
  user: DomainUser;
}

// ─── Legacy aliases ──────────────────────────
/** @deprecated dùng DomainUser */
export type AdminUser = DomainUser;
/** @deprecated dùng AuthResponse từ api/types.ts */
export type LoginResponse = import("../api/types").AuthResponse;