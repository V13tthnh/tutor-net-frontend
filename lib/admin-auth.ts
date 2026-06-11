import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'tutornet_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export interface AdminSession {
  email: string;
  role: 'admin';
  accessToken?: string;
  refreshToken?: string;
  fullName?: string;
  avatarUrl?: string | null;
  roles?: string[];
  permissions?: string[];
}

interface AdminSessionPayload extends AdminSession {
  iat: number;
  nonce: string;
}

const DEV_ADMIN_EMAIL = 'admin@tutornet.local';
const DEV_ADMIN_PASSWORD = 'admin123456';
const DEV_ADMIN_SESSION_SECRET = 'tutornet-admin-dev-session-secret';

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    (process.env.NODE_ENV === 'production' ? undefined : DEV_ADMIN_EMAIL)
  );
}

function getAdminPassword() {
  return (
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? undefined : DEV_ADMIN_PASSWORD)
  );
}

function getAdminSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    (process.env.NODE_ENV === 'production' ? undefined : DEV_ADMIN_SESSION_SECRET)
  );
}

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function safeCompare(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function sign(payload: string) {
  const secret = getAdminSessionSecret();

  if (!secret) {
    return undefined;
  }

  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isAdminLoginConfigured() {
  return Boolean(getAdminEmail() && getAdminPassword() && getAdminSessionSecret());
}

export function verifyAdminCredentials(email: string, password: string) {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();

  if (!adminEmail || !adminPassword) {
    return false;
  }

  return safeCompare(email.trim().toLowerCase(), adminEmail.toLowerCase()) &&
    safeCompare(password, adminPassword);
}

export function createAdminSessionValue(emailOrSession: string | Omit<AdminSession, 'role'>) {
  const sessionData = typeof emailOrSession === 'string' ? { email: emailOrSession } : emailOrSession;
  const payload: AdminSessionPayload = {
    ...sessionData,
    role: 'admin',
    iat: Date.now(),
    nonce: randomUUID()
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(encodedPayload);

  if (!signature) {
    throw new Error('Admin session secret is not configured.');
  }

  return `${encodedPayload}.${signature}`;
}

export function readAdminSession(value: string | undefined): AdminSession | null {
  if (!value) {
    return null;
  }

  const parts = value.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expectedSignature = sign(payload);

  if (!expectedSignature || !signature || !safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as Partial<AdminSessionPayload>;

    if (decoded.role !== 'admin' || !decoded.email || typeof decoded.iat !== 'number') {
      return null;
    }

    const expiresAt = decoded.iat + ADMIN_SESSION_MAX_AGE * 1000;
    if (Date.now() > expiresAt) {
      return null;
    }

    return {
      email: decoded.email,
      role: 'admin',
      accessToken: decoded.accessToken,
      refreshToken: decoded.refreshToken,
      fullName: decoded.fullName,
      avatarUrl: decoded.avatarUrl,
      roles: decoded.roles,
      permissions: decoded.permissions
    };
  } catch {
    return null;
  }
}

export function writeAdminSession(session: AdminSession): string {
  return createAdminSessionValue(session);
}

export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    );
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenExpiredSoon(session: AdminSession): boolean {
  if (!session.accessToken) return true;
  const expiryMs = getTokenExpiryMs(session.accessToken);
  if (!expiryMs) return false;
  // Refresh khi còn dưới 2 phút
  return Date.now() > expiryMs - 2 * 60 * 1000;
}

export async function refreshAdminSession(
  session: AdminSession
): Promise<AdminSession | null> {
  if (!session.refreshToken) return null;

  try {
    const res = await fetch('http://localhost:8080/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Backend trả accessToken + refreshToken mới
    return {
      ...session,
      accessToken: data.accessToken ?? session.accessToken,
      refreshToken: data.refreshToken ?? session.refreshToken,
    };
  } catch {
    return null;
  }
}