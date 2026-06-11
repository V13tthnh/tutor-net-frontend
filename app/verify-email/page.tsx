'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực (token) trong đường dẫn.');
      return;
    }

    const verifyToken = async () => {
      try {
        // Gọi API xác thực thông qua Next.js Proxy để gửi tới backend
        const res = await fetch(`/api/v1/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        if (res.ok) {
          const data = await res.text();
          setStatus('success');
          setMessage(data || 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.');
          
          // Chuyển hướng người dùng sang trang đăng nhập sau 3.5 giây
          const timer = setTimeout(() => {
            router.push('/auth/login');
          }, 3500);
          return () => clearTimeout(timer);
        } else {
          let errMsg = 'Xác thực email thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
          try {
            const json = await res.json();
            if (json.message) errMsg = json.message;
          } catch {
            try {
              const text = await res.text();
              if (text) errMsg = text;
            } catch {}
          }
          setStatus('error');
          setMessage(errMsg);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className='w-full max-w-md p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/20 dark:border-gray-800/80 text-center space-y-6'>
      {status === 'loading' && (
        <div className='space-y-4 py-6'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Icons.spinner size={28} className='animate-spin text-primary' />
          </div>
          <div className='space-y-1.5'>
            <h2 className='text-xl font-bold text-foreground'>Đang xác thực tài khoản</h2>
            <p className='text-sm text-muted-foreground font-light'>Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className='space-y-4 py-4'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-bounce'>
            <Icons.circleCheck size={28} className='text-green-500' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-xl font-bold text-foreground'>Xác thực thành công!</h2>
            <p className='text-sm text-muted-foreground px-2 leading-relaxed'>
              {message}
            </p>
            <p className='text-xs text-primary font-medium animate-pulse pt-2'>
              Đang tự động chuyển hướng về trang đăng nhập...
            </p>
          </div>
          <div className='pt-2'>
            <Button
              onClick={() => router.push('/auth/login')}
              className='w-full h-11 font-semibold text-sm transition-transform active:scale-95'
            >
              Đăng nhập ngay
            </Button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className='space-y-4 py-4'>
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-shake'>
            <Icons.circleX size={28} className='text-red-500' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-xl font-bold text-foreground'>Xác thực thất bại</h2>
            <p className='text-sm text-red-500 bg-red-500/5 p-3.5 rounded-2xl border border-red-500/10 text-xs text-left leading-relaxed'>
              {message}
            </p>
          </div>
          <div className='pt-2 flex flex-col gap-2'>
            <Button
              onClick={() => router.push('/auth/register')}
              className='w-full h-11 font-semibold text-sm transition-transform active:scale-95'
            >
              Đăng ký lại
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant='outline'
              className='w-full h-11 font-semibold text-sm transition-colors'
            >
              Quay lại Đăng nhập
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10 px-4'>
      {/* Blobs */}
      <div className='pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />

      <Suspense fallback={
        <div className='w-full max-w-md p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/20 dark:border-gray-800/80 text-center space-y-6'>
          <div className='space-y-4 py-6'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Icons.spinner size={28} className='animate-spin text-primary' />
            </div>
            <div className='space-y-1.5'>
              <h2 className='text-xl font-bold text-foreground'>Đang tải thông tin...</h2>
            </div>
          </div>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
