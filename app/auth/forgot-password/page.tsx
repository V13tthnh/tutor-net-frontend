import type { Metadata } from 'next';
import ForgotPasswordForm from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Quên mật khẩu | TutorNet',
  description: 'Yêu cầu liên kết đặt lại mật khẩu tài khoản TutorNet của bạn.'
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
