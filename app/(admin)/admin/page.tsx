import { redirect } from 'next/navigation';
import { getServerSession } from '@/features/auth/lib/session.server';
import { isSessionValid, hasAdminRole } from '@/features/auth/lib/auth.utils';
import { AUTH_CONFIG } from '@/features/auth/lib/auth.config';

export default async function Dashboard() {
  const session = await getServerSession();

  if (!session || !isSessionValid(session) || !hasAdminRole(session.user)) {
    return redirect(AUTH_CONFIG.ROUTES.ADMIN.LOGIN);
  } else {
    redirect(AUTH_CONFIG.ROUTES.ADMIN.DASHBOARD);
  }
}
