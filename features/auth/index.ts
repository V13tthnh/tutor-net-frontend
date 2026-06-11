// features/auth/index.ts — Public API của feature auth

// ── Domain types ──────────────────────────────────────────────────────────────
export type { DomainUser, AuthSession, AdminRole, ClientRole, AppRole } from "./types/auth.types";

// ── API types (HTTP contract) ─────────────────────────────────────────────────
export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  TokenResponse,
  MeResponse,
  UserResponse,
} from "./api/types";

// ── API errors ────────────────────────────────────────────────────────────────
export { ApiHttpError } from "./api/queries";
export { AuthServiceError } from "./api/service";

// ── Services (dùng trong Server Components / Route Handlers) ──────────────────
export {
  registerService,
  loginClientService,
  loginAdminService,
  getMeService,
  refreshSessionService,
  logoutService,
} from "./api/service";

// ── Server Actions ────────────────────────────────────────────────────────────
export { registerAction, logoutAction } from "./actions/auth.actions";
export { adminLoginAction as loginAdminAction } from "./actions/admin-login";
export { clientLoginAction as loginClientAction } from "./actions/client-login";
export type { ActionState } from "./actions/auth.actions";

// ── Server-only session helpers ───────────────────────────────────────────────
export { getServerSession, setServerSession, clearServerSession } from "./lib/session.server";

// ── Utilities ─────────────────────────────────────────────────────────────────
export {
  buildSession,
  buildSessionFromToken,
  hasAdminRole,
  isSuperAdmin,
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isSessionExpired,
  isSessionValid,
} from "./lib/auth.utils";

// ── Config ────────────────────────────────────────────────────────────────────
export { AUTH_CONFIG } from "./lib/auth.config";

// ── Components (Client) ───────────────────────────────────────────────────────
export { AdminLoginForm } from "./components/admin-login-form";

// ── Hooks (Client) ────────────────────────────────────────────────────────────
export {
  useAdminLoginForm,
  useClientLoginForm,
  useRegisterForm,
  useLoginForm, // legacy
} from "./hooks/use-auth-session";