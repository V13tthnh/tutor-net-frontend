import { NextResponse } from 'next/server';
import { getClientSession, getServerSession } from '@/features/auth/lib/session.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const portal = searchParams.get('portal');
  const referer = request.headers.get('referer');

  const isAdminRequest = portal === 'admin' ||
    !!(referer && (referer.includes('/admin') || referer.includes('/auth/admin')));

  const session = isAdminRequest ? await getServerSession() : await getClientSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    { accessToken: session.accessToken },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
