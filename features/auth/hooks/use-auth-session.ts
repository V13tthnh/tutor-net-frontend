// features/auth/hooks/useAuth.ts
"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { adminLoginAction } from "../actions/admin-login";
import { clientLoginAction } from "../actions/client-login";
import {
  registerAction,
  type ActionState,
} from "../actions/auth.actions";
import type { DomainUser } from "../types/auth.types";

const initial: ActionState = {};

/** Hook cho form đăng nhập trang quản trị */
export function useAdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, initial);
  return { state, formAction, isPending };
}

/** Hook cho form đăng nhập client (tutor / student) */
export function useClientLoginForm() {
  const [state, formAction, isPending] = useActionState(clientLoginAction, initial);
  return { state, formAction, isPending };
}

/** Hook cho form đăng ký */
export function useRegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initial);
  return { state, formAction, isPending };
}

// ─── Client auth session ──────────────────────────────────────────────────────
/**
 * Hook lấy user session hiện tại từ client session cookie.
 * Gọi GET /api/auth/me để lấy user info từ httpOnly cookie.
 */
export function useAuthSession() {
  const [user, setUser] = useState<DomainUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (forceRefresh = false) => {
    try {
      const isAdminPortal = typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/auth/admin'));
      
      let url = isAdminPortal ? "/api/auth/me?portal=admin" : "/api/auth/me";
      if (forceRefresh) {
        url += url.includes('?') ? '&refresh=true' : '?refresh=true';
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user || null);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch auth session:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch session");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleUpdate = () => {
      fetchUser(true);
    };

    window.addEventListener('auth-session-update', handleUpdate);
    return () => {
      window.removeEventListener('auth-session-update', handleUpdate);
    };
  }, [fetchUser]);

  return { user, loading, error };
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
/** @deprecated dùng useAdminLoginForm */
export const useLoginForm = useAdminLoginForm;
