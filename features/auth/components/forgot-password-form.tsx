'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type ForgotPasswordState } from '@/features/auth/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setSuccess(true);
    }
  }, [state]);

  return (
    <div className='relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10'>

      {/* ── Decorative background blobs ── */}
      <div className='pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />

      {/* ── LEFT panel (desktop only) ── */}
      <div className='relative hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex'>
        {/* Pattern overlay */}
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        {/* Logo */}
        <Link href='/' className='relative flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
            <Icons.school size={22} className='text-white' />
          </div>
          <span className='text-2xl font-bold text-white'>TutorNet</span>
        </Link>

        {/* Illustration area */}
        <div className='relative z-10 flex flex-col gap-6'>
          {/* Stats cards */}
          <div className='grid grid-cols-2 gap-4'>
            {[
              { value: '10,000+', label: 'Gia sư đã đăng ký' },
              { value: '50,000+', label: 'Học sinh thành công' },
              { value: '98%', label: 'Tỉ lệ hài lòng' },
              { value: '63', label: 'Tỉnh thành phủ sóng' },
            ].map((stat) => (
              <div key={stat.label} className='rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/20'>
                <p className='text-2xl font-bold text-white'>{stat.value}</p>
                <p className='mt-0.5 text-sm text-white/70'>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className='rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/20'>
            <p className='text-sm leading-relaxed text-white/90 italic'>
              &ldquo;TutorNet giúp con tôi tìm được gia sư Toán phù hợp trong vòng 24 giờ. Điểm số cải thiện rõ rệt sau 2 tháng học.&rdquo;
            </p>
            <div className='mt-3 flex items-center gap-3'>
              <div className='h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm'>N</div>
              <div>
                <p className='text-sm font-semibold text-white'>Nguyễn Thị Mai</p>
                <p className='text-xs text-white/60'>Phụ huynh học sinh lớp 10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <p className='relative text-xs text-white/50'>
          © 2024 TutorNet. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT panel – form ── */}
      <div className='flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16'>
        {/* Back button */}
        <div className='w-full max-w-md mb-6'>
          <Link
            href='/auth/login'
            className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <Icons.arrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
        </div>

        <div className='w-full max-w-md'>
          {/* Mobile logo */}
          <div className='mb-8 flex items-center gap-2 lg:hidden'>
            <div className='bg-primary flex h-9 w-9 items-center justify-center rounded-xl'>
              <Icons.school size={18} className='text-primary-foreground' />
            </div>
            <span className='text-xl font-bold'>TutorNet</span>
          </div>

          {/* Heading */}
          <div className='mb-8'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>Quên mật khẩu?</h1>
            <p className='mt-1.5 text-sm text-muted-foreground'>
              Nhập email đăng ký của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
            </p>
          </div>

          {success ? (
            <div className='space-y-6'>
              <div className='border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border p-4 text-sm flex items-start gap-3'>
                <Icons.circleCheck className='mt-0.5 shrink-0 size-5' />
                <div className='space-y-1.5'>
                  <p className='font-semibold'>Yêu cầu thành công!</p>
                  <p>{state.message || "Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn."}</p>
                </div>
              </div>

              <div className='text-sm text-muted-foreground text-center'>
                Không nhận được email? Kiểm tra hộp thư rác (spam) hoặc{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className='text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer'
                >
                  thử lại với email khác
                </button>
              </div>

              <Button asChild className='w-full h-11 font-semibold text-base'>
                <Link href='/auth/login'>Quay lại trang đăng nhập</Link>
              </Button>
            </div>
          ) : (
            /* Form */
            <form action={formAction} className='space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='email'>Email của bạn</Label>
                <div className='relative'>
                  <Icons.email size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='example@email.com'
                    autoComplete='email'
                    className='h-11 pl-9'
                    defaultValue={state.email}
                    required
                  />
                </div>
              </div>

              {state.error && (
                <div className='border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm flex items-center gap-2'>
                  <Icons.alertCircle className='shrink-0 size-4' />
                  <p>{state.error}</p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full h-11 font-semibold text-base'
                disabled={isPending}
              >
                {isPending ? (
                  <span className='flex items-center gap-2 justify-center'>
                    <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24' fill='none'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
                    </svg>
                    Đang gửi yêu cầu...
                  </span>
                ) : 'Gửi yêu cầu'}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className='mt-8 text-center text-xs text-muted-foreground'>
            Quay lại{' '}
            <Link href='/auth/login' className='text-primary font-semibold hover:underline'>
              Đăng nhập
            </Link>{' '}
            hoặc{' '}
            <Link href='/auth/register' className='text-primary font-semibold hover:underline'>
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
