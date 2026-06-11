import type { Metadata } from 'next';
import PublicSignInPage from '@/features/auth/components/client-login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | TutorNet',
  description: 'Đăng nhập vào TutorNet để tìm gia sư chất lượng cao trên toàn quốc.'
};

export default function SignInPage() {
  return <PublicSignInPage />;
}
