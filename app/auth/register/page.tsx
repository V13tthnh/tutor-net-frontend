import type { Metadata } from 'next';
import PublicSignUpPage from '@/features/auth/components/client-register-form';

export const metadata: Metadata = {
  title: 'Đăng ký | TutorNet',
  description: 'Tạo tài khoản TutorNet miễn phí để kết nối với gia sư chất lượng cao trên toàn quốc.'
};

export default function SignUpPage() {
  return <PublicSignUpPage />;
}
