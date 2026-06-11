import type { Metadata } from 'next';
import ResetPasswordForm from '@/features/auth/components/reset-password-form';
import { Suspense } from 'react';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu | TutorNet',
  description: 'Đặt mật khẩu mới cho tài khoản TutorNet của bạn.'
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-background'>
          <div className='flex flex-col items-center gap-2'>
            <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Đang tải...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
