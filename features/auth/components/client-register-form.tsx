'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';


export default function PublicSignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const passwordStrength = (): { level: number; label: string; color: string } => {
    const p = form.password;
    if (p.length === 0) return { level: 0, label: '', color: '' };
    if (p.length < 6) return { level: 1, label: 'Yếu', color: 'bg-red-500' };
    if (p.length < 10 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 2, label: 'Trung bình', color: 'bg-yellow-500' };
    return { level: 3, label: 'Mạnh', color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend Validations
    if (!form.fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!form.email.trim()) {
      setError('Email không được để trống');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Email không đúng định dạng');
      return;
    }
    if (form.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient<{
        success: boolean;
        message: string;
        data?: {
          message?: string;
        };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirm
        })
      });

      if (response.success) {
        setSuccessMessage(
          response.data?.message ||
          'Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để hoàn tất xác thực.'
        );
        setStep(2);
      } else {
        setError(response.message || 'Đăng ký thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-gray-950 dark:via-gray-900 dark:to-primary/10'>

      {/* Blobs */}
      <div className='pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl' />

      {/* ── LEFT decorative ── */}
      <div className='relative hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex'>
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <Link href='/' className='relative flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20'>
            <Icons.school size={22} className='text-white' />
          </div>
          <span className='text-2xl font-bold text-white'>TutorNet</span>
        </Link>

        <div className='relative z-10 space-y-6'>
          <div>
            <h2 className='text-3xl font-bold text-white'>Bắt đầu hành trình học tập của bạn</h2>
            <p className='mt-3 text-base text-white/70 leading-relaxed'>
              Đăng ký tài khoản TutorNet để kết nối với hàng ngàn gia sư chất lượng cao trên toàn quốc.
            </p>
          </div>

          {/* Benefits list */}
          <ul className='space-y-3'>
            {[
              'Tìm gia sư phù hợp trong vài phút',
              'Xem CV & lịch dạy minh bạch',
              'Nhắn tin & đặt lịch dễ dàng',
              'Bảo vệ quyền lợi hai bên',
            ].map((item) => (
              <li key={item} className='flex items-start gap-3'>
                <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20'>
                  <Icons.check size={12} className='text-white' />
                </span>
                <span className='text-sm text-white/80'>{item}</span>
              </li>
            ))}
          </ul>

          {/* Avatars */}
          <div className='rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/20'>
            <div className='flex -space-x-2'>
              {['A', 'B', 'C', 'D', 'E'].map((l) => (
                <div key={l} className='h-9 w-9 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold'>
                  {l}
                </div>
              ))}
              <div className='h-9 w-9 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center text-white text-[10px] font-bold'>
                +99k
              </div>
            </div>
            <p className='mt-2 text-sm text-white/70'>Hơn 99,000 người đã tin dùng TutorNet</p>
          </div>
        </div>

        <p className='relative text-xs text-white/50'>© 2024 TutorNet. All rights reserved.</p>
      </div>

      {/* ── RIGHT form ── */}
      <div className='flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16'>
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
          <div className='mb-6 flex items-center gap-2 lg:hidden'>
            <div className='bg-primary flex h-9 w-9 items-center justify-center rounded-xl'>
              <Icons.school size={18} className='text-primary-foreground' />
            </div>
            <span className='text-xl font-bold'>TutorNet</span>
          </div>


          {/* Heading */}
          <div className='mb-6'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {step === 1 ? 'Tạo tài khoản' : 'Xác thực tài khoản'}
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              {step === 1
                ? 'Điền thông tin để hoàn tất đăng ký'
                : 'Xác thực tài khoản qua thư điện tử'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className='mb-6 flex items-center gap-2'>
            {([1, 2] as const).map((s) => (
              <div key={s} className='flex items-center gap-2'>
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step > s ? <Icons.check size={13} /> : s}
                </div>
                <span className={cn('text-xs', step >= s ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {s === 1 ? 'Tạo tài khoản' : 'Xác nhận'}
                </span>
                {s < 2 && <div className='mx-1 h-px w-8 bg-border' />}
              </div>
            ))}
          </div>

          {step === 2 ? (
            /* ─ Step 3: Verification Wait Screen ─ */
            <div className='space-y-6 text-center py-4'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.15)]'>
                <Icons.email size={32} className='text-primary' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-xl font-bold text-foreground'>
                  Kiểm tra hộp thư của bạn
                </h3>
                <p className='text-sm text-muted-foreground leading-relaxed px-2'>
                  {successMessage || 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để hoàn tất xác thực.'}
                </p>
              </div>
              <div className='rounded-2xl bg-muted/40 p-5 border border-border/80 text-left text-xs space-y-3 text-muted-foreground'>
                <p className='font-semibold text-foreground flex items-center gap-1.5'>
                  <Icons.info size={14} className='text-primary' />
                  Hướng dẫn tiếp theo:
                </p>
                <ul className='list-disc pl-4 space-y-1.5'>
                  <li>Tìm email gửi từ <code className='bg-background px-1 py-0.5 rounded border border-border font-mono text-[10px]'>vietthanh051103@gmail.com</code>.</li>
                  <li>Click vào liên kết hoặc nút <strong>"Xác thực ngay"</strong> để kích hoạt tài khoản.</li>
                  <li>Nếu không nhận được email trong vài phút, vui lòng kiểm tra hộp thư <strong>Spam (Thư rác)</strong>.</li>
                </ul>
              </div>
              <div className='pt-2'>
                <Button
                  onClick={() => router.push('/auth/login')}
                  className='w-full h-11 font-semibold text-base transition-transform active:scale-95'
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-5'>
              {error && (
                <div className='p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-start gap-2.5 shadow-sm'>
                  <Icons.alertCircle size={16} className='shrink-0 mt-0.5 text-red-600' />
                  <span className='leading-normal'>{error}</span>
                </div>
              )}

              {/* ─ Account info form ─ */}
              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='fullName'>Họ và tên</Label>
                  <div className='relative'>
                    <Icons.user size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='fullName'
                      placeholder='Nguyễn Văn A'
                      className='h-11 pl-9'
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='signup-email'>Email</Label>
                  <div className='relative'>
                    <Icons.email size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='signup-email'
                      type='email'
                      placeholder='example@email.com'
                      className='h-11 pl-9'
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='signup-password'>Mật khẩu</Label>
                  <div className='relative'>
                    <Icons.lock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='signup-password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Tối thiểu 8 ký tự'
                      className='h-11 pl-9 pr-10'
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <Icons.eyeOff size={16} /> : <Icons.eye size={16} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div className='space-y-1'>
                      <div className='flex gap-1'>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            i <= strength.level ? strength.color : 'bg-muted'
                          )} />
                        ))}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Độ mạnh: <span className='font-medium'>{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='confirm'>Xác nhận mật khẩu</Label>
                  <div className='relative'>
                    <Icons.lock size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='confirm'
                      type={showConfirm ? 'text' : 'password'}
                      placeholder='Nhập lại mật khẩu'
                      className={cn(
                        'h-11 pl-9 pr-10',
                        form.confirm && form.confirm !== form.password && 'border-red-500 focus-visible:ring-red-500'
                      )}
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      required
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <Icons.eyeOff size={16} /> : <Icons.eye size={16} />}
                    </button>
                  </div>
                  {form.confirm && form.confirm !== form.password && (
                    <p className='text-xs text-red-500'>Mật khẩu không khớp</p>
                  )}
                </div>

                <div className='pt-1'>
                  <Button
                    type='submit'
                    className='w-full h-11 font-semibold'
                    disabled={isLoading || (!!form.confirm && form.confirm !== form.password)}
                  >
                    {isLoading ? (
                      <span className='flex items-center gap-2'>
                        <Spinner />
                        Đang tạo tài khoản...
                      </span>
                    ) : 'Đăng ký'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <p className='mt-6 text-center text-sm text-muted-foreground'>
            Đã có tài khoản?{' '}
            <Link href='/auth/login' className='text-primary font-semibold hover:underline'>
              Đăng nhập ngay
            </Link>
          </p>

          <p className='mt-3 text-center text-xs text-muted-foreground'>
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <Link href='/terms-of-service' className='hover:text-primary underline underline-offset-4'>
              Điều khoản
            </Link>{' '}
            và{' '}
            <Link href='/privacy-policy' className='hover:text-primary underline underline-offset-4'>
              Chính sách bảo mật
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
