// app/api/security-flags/route.ts
// GET → read active flags; POST → update flags (admin only)

import { NextRequest, NextResponse } from 'next/server';
import {
  SANDBOX_COOKIE,
  encodeSecurityFlags,
  decodeSecurityFlags,
} from '@/lib/security-sandbox';
import { getSessionFromCookies } from '@/features/auth/lib/auth.utils';
import { hasAdminRole } from '@/features/auth/lib/auth.utils';
import type { SecurityFlag } from '@/features/security-sandbox/types';
import { ALL_FLAGS } from '@/features/security-sandbox/types';

export const dynamic = 'force-dynamic';

const SANDBOX_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  const raw = request.cookies.get(SANDBOX_COOKIE)?.value;
  const flags = decodeSecurityFlags(raw);

  return NextResponse.json({
    flags,
    active: flags.length > 0,
  });
}

export async function POST(request: NextRequest) {
  // Verify admin session
  const session = getSessionFromCookies(request.cookies, 'admin');
  if (!session || !hasAdminRole(session.user)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: { flags?: SecurityFlag[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }

  // Validate: only allow known flags
  const incoming = body.flags ?? [];
  const validFlags = incoming.filter((f): f is SecurityFlag =>
    (ALL_FLAGS as string[]).includes(f)
  );

  const cookieValue = encodeSecurityFlags(validFlags);

  const response = NextResponse.json({
    success: true,
    flags: validFlags,
    active: validFlags.length > 0,
  });

  response.cookies.set(SANDBOX_COOKIE, cookieValue, {
    httpOnly: false, // must be readable by JS for banner display
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SANDBOX_MAX_AGE,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  // Clear all flags
  const session = getSessionFromCookies(request.cookies, 'admin');
  if (!session || !hasAdminRole(session.user)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, flags: [], active: false });
  response.cookies.delete(SANDBOX_COOKIE);
  return response;
}
