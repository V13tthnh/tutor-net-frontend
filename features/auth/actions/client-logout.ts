'use server';

import { getClientSession, clearClientSession } from '../lib/session.server';
import { logoutService } from '../api/service';

export async function clientLogoutAction() {
  try {
    const session = await getClientSession();
    if (session?.accessToken) {
      await logoutService(session.accessToken);
    }
  } catch (e) {
    console.error('Backend client logout error:', e);
  }

  await clearClientSession();
  return { success: true };
}
