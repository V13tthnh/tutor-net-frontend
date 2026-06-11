// features/auth/lib/auth.config.ts

export const AUTH_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080/api/v1",

  ENDPOINTS: {
    REGISTER:      "/auth/register",
    CLIENT_LOGIN:  "/auth/login",
    ADMIN_LOGIN:   "/auth/admin/login",
    ME:            "/auth/me",
    REFRESH_TOKEN: "/auth/refresh",
    LOGOUT:        "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  COOKIES: {
    /** HttpOnly cookie cho admin session (path: /admin) */
    ADMIN_SESSION:  "admin_session",
    /** HttpOnly cookie cho client session (path: /) */
    CLIENT_SESSION: "client_session",
  },

  ROUTES: {
    ADMIN: {
      LOGIN:     "/auth/admin/login",
      DASHBOARD: "/admin/dashboard",
    },
    CLIENT: {
      SIGN_IN:   "/auth/sign-in",
      SIGN_UP:   "/auth/sign-up",
      DASHBOARD: "/",
      FORGOT_PASSWORD: "/auth/forgot-password",
      RESET_PASSWORD: "/reset-password",
    },
  },

  ALLOWED_ADMIN_ROLES: ["admin", "super_admin"] as string[],

  /** Trigger refresh trước khi hết hạn 1 phút */
  REFRESH_BUFFER_MS: 60 * 1_000,
} as const;