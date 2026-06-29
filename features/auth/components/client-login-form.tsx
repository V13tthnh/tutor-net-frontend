'use client';

import { useState, useActionState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clientLoginAction, type ClientLoginState } from '@/features/auth/actions/client-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import Script from 'next/script';

import { getClientSecurityFlags } from '@/features/security-sandbox/components/interceptor';

const initialState: ClientLoginState = {};

const v3SiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || '6Ldt4Q4TAAAAAO1v4a_4v4x8e-4N_v4t_4e4t_4e';
const v2SiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function PublicSignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();

  // FIX Bug 2: Tách isPending ra khỏi useActionState, dùng useTransition
  // để có thể await getV3Token() trước khi dispatch action
  const [state, formAction] = useActionState(clientLoginAction, initialState);
  const [isPending, startTransition] = useTransition();

  const [activeFlags, setActiveFlags] = useState<string[]>([]);

  // reCAPTCHA states
  const [v2Token, setV2Token] = useState('');
  const [showV2, setShowV2] = useState(true); // Mặc định bật reCAPTCHA v2 để hiển thị checkbox
  const [useMockCheckbox, setUseMockCheckbox] = useState(false);

  // FIX Bug 1: Không lưu v3Token vào state nữa — sẽ lấy fresh token tại submit
  // Chỉ track xem script đã load chưa
  const recaptchaReadyRef = useRef(false);

  const redirectTo = searchParams.get('next') || searchParams.get('redirectTo') || undefined;

  useEffect(() => {
    setActiveFlags(getClientSecurityFlags());
  }, []);

  useEffect(() => {
    const urlSession = searchParams.get('TUTOR_SESSION');
    if (urlSession) {
      document.cookie = `TUTOR_SESSION=${urlSession}; path=/; max-age=3600`;
    }
  }, [searchParams]);

  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.href = state.redirectTo;
    }
    if (state.captchaFallback) {
      setShowV2(true);
    }
  }, [state]);

  // FIX Bug 1: Script load chỉ đánh dấu ready, KHÔNG execute token ở đây
  const handleRecaptchaLoad = () => {
    recaptchaReadyRef.current = true;
  };

  // FIX Bug 1: Hàm lấy v3 token fresh — gọi đúng lúc submit
  async function getFreshV3Token(): Promise<string> {
    return new Promise((resolve) => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha || !recaptchaReadyRef.current) {
        resolve('mock-v3-token');
        return;
      }
      grecaptcha.ready(() => {
        grecaptcha
          .execute(v3SiteKey, { action: 'login' })
          .then((token: string) => resolve(token))
          .catch(() => resolve('mock-v3-token'));
      });
    });
  }

  useEffect(() => {
    if (!showV2 || typeof window === 'undefined') return;

    // Load Google reCAPTCHA v2 chính thức để hiển thị Widget Checkbox (kể cả ở Localhost dùng Test Key)

    // Production (domain thật): load Google reCAPTCHA v2 bình thường
    (window as any).grecaptcha = undefined;
    recaptchaReadyRef.current = false;

    const oldScript = document.getElementById('recaptcha-v3-script-tag');
    if (oldScript) oldScript.remove();

    const badges = document.getElementsByClassName('grecaptcha-badge');
    while (badges.length > 0) badges[0].remove();

    const script = document.createElement('script');
    script.id = 'recaptcha-v2-script-tag';
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha) return;
      grecaptcha.ready(() => {
        const container = document.getElementById('recaptcha-v2-container');
        if (container) container.innerHTML = '';
        try {
          grecaptcha.render('recaptcha-v2-container', {
            sitekey: v2SiteKey,
            callback: (token: string) => setV2Token(token),
            'expired-callback': () => setV2Token(''),
            'error-callback': () => {
              setUseMockCheckbox(true);
              setV2Token('');
            },
          });
        } catch {
          setUseMockCheckbox(true);
        }
      });
    };
    script.onerror = () => setUseMockCheckbox(true);
    document.body.appendChild(script);
  }, [showV2]);

  // FIX Bug 2: Chuyển submit sang onSubmit handler để có thể await token
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!showV2) {
      // FIX Bug 1: Lấy token fresh ngay tại thời điểm submit, không dùng token cũ
      const freshToken = await getFreshV3Token();
      fd.set('recaptchaV3Token', freshToken);
      fd.delete('recaptchaV2Token');
    } else {
      fd.set('recaptchaV2Token', v2Token);
      fd.delete('recaptchaV3Token');
    }

    startTransition(() => {
      formAction(fd);
    });
  };

  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <div className='relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10'>
      {!showV2 && (
        <Script
          id="recaptcha-v3-script-tag"
          src={`https://www.google.com/recaptcha/api.js?render=${v3SiteKey}`}
          strategy='afterInteractive'
          onLoad={handleRecaptchaLoad}
        />
      )}

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
            href='/'
            className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <Icons.arrowLeft size={16} />
            Về trang chủ
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
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>Chào mừng trở lại!</h1>
            <p className='mt-1.5 text-sm text-muted-foreground'>
              Chưa có tài khoản?{' '}
              <Link href='/auth/register' className='text-primary font-semibold hover:underline'>
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* FIX Bug 2: Dùng onSubmit thay action={formAction} */}
          <form onSubmit={handleSubmit} className='space-y-4' noValidate>
            {redirectTo && <input type='hidden' name='redirectTo' value={redirectTo} />}

            {/* ── Email ── */}
            <div className='space-y-1.5'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Icons.email size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='example@email.com'
                  autoComplete='email'
                  className={`h-11 pl-9 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  defaultValue={state.email}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id='email-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                  {emailError}
                </p>
              )}
            </div>

            {/* ── Password ── */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Mật khẩu</Label>
                <Link href='/auth/forgot-password' className='text-xs text-primary hover:underline'>
                  Quên mật khẩu?
                </Link>
              </div>
              <div className='relative'>
                <Icons.lock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  autoComplete='current-password'
                  className={`h-11 pl-9 pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <Icons.eyeOff size={22} /> : <Icons.eye size={22} />}
                </button>
              </div>
              {passwordError && (
                <p id='password-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                  {passwordError}
                </p>
              )}
            </div>

            {/* ── Lỗi chung (API error: 401, 500...) ── */}
            {state.error && (
              <p
                className='border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm'
                role='alert'
                aria-live='polite'
              >
                {state.error}
              </p>
            )}

            <div className='flex items-center gap-2'>
              <Checkbox id='remember' name='remember' />
              <label htmlFor='remember' className='text-sm text-muted-foreground cursor-pointer select-none'>
                Ghi nhớ đăng nhập
              </label>
            </div>

            {showV2 && (
              <div className="flex justify-center py-2 border border-dashed border-primary/20 rounded-xl bg-primary/5 p-4 my-2">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-primary">
                    {useMockCheckbox
                      ? "Xác minh người dùng:"
                      : "Vui lòng thực hiện xác thực:"}
                  </p>

                  {useMockCheckbox ? (
                    <div className="flex items-center gap-2 border p-3 rounded-lg bg-background shadow-sm animate-in fade-in duration-200">
                      <input
                        type="checkbox"
                        id="mock-captcha-checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        onChange={(e) => {
                          // FIX Bug 3: mock token được nhận diện ở server, không cần gọi Google
                          setV2Token(e.target.checked ? 'mock-v2-token' : '');
                        }}
                      />
                      <label htmlFor="mock-captcha-checkbox" className="text-xs text-foreground font-medium select-none cursor-pointer">
                        Tôi xác nhận tôi là người dùng thật
                      </label>
                    </div>
                  ) : (
                    <div id="recaptcha-v2-container"></div>
                  )}
                </div>
              </div>
            )}

            {/* ── Sandbox Session Security HUD ── */}
            {activeFlags.includes('session_hijacking') && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1 mt-2 text-amber-800 dark:text-amber-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <Icons.info size={14} className="text-amber-500 shrink-0" /> Sandbox: Đang kích hoạt Session Hijacking!
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Cookie <code>client_access_token</code> sẽ được thiết lập <strong>không có cờ HttpOnly</strong>. Bạn có thể mở Console (F12) và gõ <code>document.cookie</code> để đọc trộm token đăng nhập sau khi vào hệ thống.
                </p>
              </div>
            )}

            {activeFlags.includes('session_fixation') && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1 mt-2 text-amber-800 dark:text-amber-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <Icons.info size={14} className="text-amber-500 shrink-0" /> Sandbox: Đang kích hoạt Session Fixation!
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Hệ thống sẽ giữ nguyên cookie Session ID cố định trong <code>TUTOR_SESSION</code> (không regenerate phiên làm việc) sau khi bạn đăng nhập thành công.
                </p>
              </div>
            )}

            <Button
              type='submit'
              className='w-full h-11 font-semibold text-base'
              disabled={isPending}
            >
              {isPending ? (
                <span className='flex items-center gap-2'>
                  <svg className='animate-spin h-4 w-4' viewBox='0 0 24 24' fill='none'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : 'Đăng nhập'}
            </Button>
          </form>

          {/* Footer */}
          <p className='mt-8 text-center text-xs text-muted-foreground'>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <Link href='/terms-of-service' className='hover:text-primary underline underline-offset-4'>
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link href='/privacy-policy' className='hover:text-primary underline underline-offset-4'>
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}

// form submit
//   → handleSubmit()               ← await getFreshV3Token() trước khi dispatch
//   → clientLoginAction()          ← actions/client-login.ts
//       → verifyRecaptcha()        ← mock token early-return, hoặc gọi Google
//       → validateLoginInput()     ← lib/login-validation.ts (field-level)
//       → loginClientService()     ← api/service.ts
//           → queryClientLogin()   ← api/queries.ts (POST /auth/login)
//       → setClientSession()       ← lib/session.server.ts
//           → cookie "client_session" { httpOnly, path: "/", maxAge: ... }
//       → return { success: true, redirectTo: "/" }
//   → useEffect: window.location.href = redirectTo  ← PublicSignInPage.tsx