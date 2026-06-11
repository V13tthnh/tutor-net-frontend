import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/features/auth/lib/session.server';
import { isSessionValid, hasAdminRole } from '@/features/auth/lib/auth.utils';
import { AdminLoginForm } from '@/features/auth/components/admin-login-form';
import { SessionExpiredBanner } from '@/features/auth/components/session-expired-banner';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Admin Login | TutorNet',
  description: 'Đăng nhập khu vực quản trị TutorNet.',
  robots: {
    index: false,
    follow: false
  }
};

type PageProps = {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (session && isSessionValid(session) && hasAdminRole(session.user)) {
    redirect('/admin/dashboard');
  }

  const params = await searchParams;
  const redirectTo = Array.isArray(params.next) ? params.next[0] : params.next;

  return (
    <main className='bg-background text-foreground min-h-screen'>
      <div className='grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]'>
        <section className='relative hidden overflow-hidden border-r bg-zinc-950 text-white lg:flex'>
          <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px]' />
          <div className='absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-500/20 via-rose-500/10 to-transparent' />

          <div className='relative z-10 flex min-h-screen w-full flex-col justify-between p-12'>
            <div className='flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-md bg-muted-foreground text-zinc-950'>
                <Icons.school className='h-6 w-6' />
              </div>
              <div>
                <p className='text-lg font-semibold'>TutorNet</p>
                <p className='text-xs tracking-[0.28em] text-amber-200 uppercase'>Admin Console</p>
              </div>
            </div>

            <div className='max-w-xl space-y-6'>
              <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-amber-100'>
                <Icons.shieldCheck className='h-4 w-4' />
                Server-side access
              </div>
              <div className='space-y-4'>
                <h1 className='text-5xl leading-tight font-semibold tracking-normal'>
                  TutorNet Admin
                </h1>
                <p className='max-w-md text-base leading-7 text-zinc-300'>
                  Bảng điều hành kiểm duyệt, phân quyền và vận hành hệ thống gia sư.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-3 text-sm'>
              <div className='border-t border-white/20 pt-3'>
                <p className='font-semibold text-white'>RBAC</p>
                <p className='mt-1 text-xs text-zinc-400'>Roles and permissions</p>
              </div>
              <div className='border-t border-white/20 pt-3'>
                <p className='font-semibold text-white'>Audit</p>
                <p className='mt-1 text-xs text-zinc-400'>System activity</p>
              </div>
              <div className='border-t border-white/20 pt-3'>
                <p className='font-semibold text-white'>Ops</p>
                <p className='mt-1 text-xs text-zinc-400'>Daily moderation</p>
              </div>
            </div>
          </div>
        </section>

        <section className='flex items-center justify-center px-6 py-10'>
          <div className='w-full max-w-[420px]'>
            <div className='mb-8 flex items-center gap-3 lg:hidden'>
              <div className='bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-md'>
                <Icons.school className='h-5 w-5' />
              </div>
              <div>
                <p className='font-semibold'>TutorNet</p>
                <p className='text-muted-foreground text-xs uppercase tracking-[0.22em]'>
                  Admin Console
                </p>
              </div>
            </div>

            <div className='border-border bg-card rounded-lg border p-6 shadow-sm'>
              <div className='mb-6 space-y-2'>

                <div>
                  <h2 className='text-2xl font-semibold tracking-normal'>Đăng nhập quản trị</h2>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Sử dụng tài khoản admin đã cấu hình trên server.
                  </p>
                </div>
              </div>

              <Suspense>
                <SessionExpiredBanner />
              </Suspense>
              <AdminLoginForm redirectTo={redirectTo} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
