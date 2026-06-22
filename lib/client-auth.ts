import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const CLIENT_SESSION_COOKIE = 'tutornet_session';
export const CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

export interface ClientSession {
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  fullName: string;
  avatarUrl?: string | null;
  roles: string[];
  permissions: string[];
}

interface ClientSessionPayload extends ClientSession {
  iat: number;
  nonce: string;
}

function getClientSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      '[Security] AUTH_SECRET/ADMIN_SESSION_SECRET chua duoc cau hinh. Them AUTH_SECRET hoac ADMIN_SESSION_SECRET vao .env.local.'
    );
  }
  return secret;
}

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function safeCompare(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function sign(payload: string) {
  const secret = getClientSessionSecret();

  if (!secret) {
    return undefined;
  }

  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createClientSessionValue(session: Omit<ClientSession, 'role'> & { role?: string }) {
  const primaryRole = session.roles?.[0] || 'student';
  const payload: ClientSessionPayload = {
    ...session,
    role: session.role || primaryRole,
    iat: Date.now(),
    nonce: randomUUID()
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(encodedPayload);

  if (!signature) {
    throw new Error('Client session secret is not configured.');
  }

  return `${encodedPayload}.${signature}`;
}

export function readClientSession(value: string | undefined): ClientSession | null {
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
    ) as Partial<ClientSessionPayload>;

    if (!decoded.email || typeof decoded.iat !== 'number') {
      return null;
    }

    const expiresAt = decoded.iat + CLIENT_SESSION_MAX_AGE * 1000;
    if (Date.now() > expiresAt) {
      return null;
    }

    return {
      email: decoded.email,
      role: decoded.role || decoded.roles?.[0] || 'student',
      accessToken: decoded.accessToken || '',
      refreshToken: decoded.refreshToken || '',
      fullName: decoded.fullName || '',
      avatarUrl: decoded.avatarUrl,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };
  } catch {
    return null;
  }
}
