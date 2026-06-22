// features/auth/lib/auth.utils.ts

import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_CONFIG } from "./auth.config";
import type { AuthSession, DomainUser } from "../types/auth.types";
import type { AuthResponse, TokenResponse } from "../api/types";

// ─── Session builders ─────────────────────────────────────────────────────────

/**
 * Tạo AuthSession từ AuthResponse (login / register).
 * AuthResponse kèm đủ cả token lẫn user.
 */
export function buildSession(data: AuthResponse): AuthSession {
  return {
    accessToken:  data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt:    Date.now() + data.expiresIn * 1_000,
    user:         data.user,
  };
}

/**
 * Cập nhật token trong session sau khi refresh.
 * TokenResponse không kèm user → giữ lại user từ session cũ.
 */
export function buildSessionFromToken(
  token: TokenResponse,
  currentUser: DomainUser
): AuthSession {
  return {
    accessToken:  token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt:    Date.now() + token.expiresIn * 1_000,
    user:         currentUser,
  };
}

// ─── Session guards ───────────────────────────────────────────────────────────

export function isSessionExpired(session: AuthSession): boolean {
  return Date.now() >= session.expiresAt - AUTH_CONFIG.REFRESH_BUFFER_MS;
}

export function isSessionValid(session: AuthSession | null): session is AuthSession {
  if (!session) return false;
  return !isSessionExpired(session);
}

// ─── Role / permission helpers ────────────────────────────────────────────────

export function hasAdminRole(user: DomainUser): boolean {
  return user.roles.some((r) => AUTH_CONFIG.ALLOWED_ADMIN_ROLES.includes(r));
}

export function isSuperAdmin(user: DomainUser): boolean {
  return user.roles.includes("super_admin");
}

export function hasRole(user: DomainUser, role: string): boolean {
  return user.roles.includes(role);
}

export function hasPermission(user: DomainUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: DomainUser, permissions: string[]): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: DomainUser, permissions: string[]): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}

// ─── Session serialization (for HttpOnly cookies) ────────────────────────────

export function serializeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function deserializeSession(raw: string): AuthSession | null {
  try {
    const json = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(json) as AuthSession;
  } catch {
    return null;
  }
}

export function signUserCookie(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('[Security] Session secret is not configured.');
  }
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyAndExtractUserCookie(signedValue: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('[Security] Session secret is not configured.');
  }

  const lastDot = signedValue.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);

  const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url');

  try {
    const sigBuffer = Buffer.from(signature, 'base64url');
    const expectedSigBuffer = Buffer.from(expectedSignature, 'base64url');
    
    if (sigBuffer.length !== expectedSigBuffer.length) {
      return null;
    }
    
    const isMatch = timingSafeEqual(sigBuffer, expectedSigBuffer);
    return isMatch ? payload : null;
  } catch {
    return null;
  }
}

export interface RequestCookies {
  get(name: string): { value: string } | undefined;
}

export function getSessionFromCookies(cookies: RequestCookies, prefix: 'admin' | 'client'): AuthSession | null {
  const accessToken = cookies.get(`${prefix}_access_token`)?.value || '';
  const refreshToken = cookies.get(`${prefix}_refresh_token`)?.value;
  const userSigned = cookies.get(`${prefix}_user`)?.value;

  if (!refreshToken || !userSigned) return null;

  const userRaw = verifyAndExtractUserCookie(userSigned);
  if (!userRaw) return null;

  try {
    const userJson = Buffer.from(userRaw, 'base64').toString('utf-8');
    const user = JSON.parse(userJson) as DomainUser;
    return {
      accessToken,
      refreshToken,
      expiresAt: accessToken ? Date.now() + 5 * 60 * 1000 : 0,
      user
    };
  } catch {
    return null;
  }
}