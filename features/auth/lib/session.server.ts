// ⚠️  Server-only — không import trong Client Components

import "server-only";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "./auth.config";
import { getSessionFromCookies, signUserCookie } from "./auth.utils";
import type { AuthSession } from "../types/auth.types";

// ─── Cookie options ───────────────────────────────────────────────────────────

const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

// ─── Admin session (path: /admin) ─────────────────────────────────────────────

export async function getServerSession(): Promise<AuthSession | null> {
  const store = await cookies();
  return getSessionFromCookies(store, 'admin');
}

export async function setServerSession(session: AuthSession): Promise<void> {
  const store = await cookies();

  if (session.accessToken) {
    const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1_000));
    store.set('admin_access_token', session.accessToken, {
      ...BASE_OPTIONS,
      path: "/",
      maxAge,
    });
  } else {
    store.delete('admin_access_token');
  }

  store.set('admin_refresh_token', session.refreshToken, {
    ...BASE_OPTIONS,
    path: "/",
    maxAge: 24 * 60 * 60, // 24 hours
  });

  const userRaw = Buffer.from(JSON.stringify(session.user)).toString('base64');
  const userSigned = signUserCookie(userRaw);
  store.set('admin_user', userSigned, {
    ...BASE_OPTIONS,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearServerSession(): Promise<void> {
  const store = await cookies();
  store.delete('admin_access_token');
  store.delete('admin_refresh_token');
  store.delete('admin_user');
}

// ─── Client session (path: /) ─────────────────────────────────────────────────

export async function getClientSession(): Promise<AuthSession | null> {
  const store = await cookies();
  return getSessionFromCookies(store, 'client');
}

import { getSecurityFlagsFromCookies } from "@/lib/security-sandbox";

export async function setClientSession(session: AuthSession): Promise<void> {
  const store = await cookies();
  const flags = getSecurityFlagsFromCookies(store);
  const isHijackActive = flags.includes('session_hijacking');

  const options = {
    ...BASE_OPTIONS,
    httpOnly: !isHijackActive,
  };

  if (session.accessToken) {
    const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1_000));
    store.set('client_access_token', session.accessToken, {
      ...options,
      path: "/",
      maxAge,
    });
  } else {
    store.delete('client_access_token');
  }

  store.set('client_refresh_token', session.refreshToken, {
    ...options,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  const userRaw = Buffer.from(JSON.stringify(session.user)).toString('base64');
  const userSigned = signUserCookie(userRaw);
  store.set('client_user', userSigned, {
    ...options,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearClientSession(): Promise<void> {
  const store = await cookies();
  store.delete('client_access_token');
  store.delete('client_refresh_token');
  store.delete('client_user');
}