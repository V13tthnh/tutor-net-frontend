// lib/security-sandbox.ts
// Server-side utilities for reading/writing security sandbox flags

import { createHmac } from 'node:crypto';
import type { SecurityFlag } from '@/features/security-sandbox/types';

export const SANDBOX_COOKIE = 'security_sandbox';

function getSandboxSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET || 'sandbox-dev-secret';
}

function sign(payload: string): string {
  return createHmac('sha256', getSandboxSecret()).update(payload).digest('base64url');
}

/**
 * Serialize flags list to a signed cookie value.
 */
export function encodeSecurityFlags(flags: SecurityFlag[]): string {
  const payload = Buffer.from(JSON.stringify(flags)).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

/**
 * Decode and verify a signed cookie value → returns flag list or empty array.
 */
export function decodeSecurityFlags(cookieValue: string | undefined): SecurityFlag[] {
  if (!cookieValue) return [];
  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return [];

  const payload = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);
  const expectedSig = sign(payload);

  if (signature !== expectedSig) return [];

  try {
    const json = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed as SecurityFlag[];
  } catch {
    return [];
  }
}

/**
 * Check if a specific vulnerability flag is enabled.
 * Uses the raw cookie value directly (for use in middleware / route handlers).
 */
export function isVulnEnabled(
  flags: SecurityFlag[],
  flag: SecurityFlag
): boolean {
  return flags.includes(flag);
}

/**
 * Parse security flags from a cookie string (RequestCookies-compatible).
 */
export interface CookieGetter {
  get(name: string): { value: string } | undefined;
}

export function getSecurityFlagsFromCookies(cookies: CookieGetter): SecurityFlag[] {
  const raw = cookies.get(SANDBOX_COOKIE)?.value;
  return decodeSecurityFlags(raw);
}

/**
 * Returns true if at least one flag is active.
 */
export function isSandboxActive(flags: SecurityFlag[]): boolean {
  return flags.length > 0;
}