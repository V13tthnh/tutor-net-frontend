import { adminLogoutAction } from '@/features/auth/actions/auth.actions';

export async function GET() {
  await adminLogoutAction();
}
