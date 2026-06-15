'use client';

import { useState } from 'react';
import {
  IconSearch,
  IconLoader2,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconBook,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconCurrencyDong,
  IconUserCheck,
  IconUsers,
  IconPhone,
  IconLock,
  IconShieldCheck,
  IconHash,
  IconEye,
  IconEyeOff,
  IconMailCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { trackClassRequest } from '../api/track-service';
import type { ClassRequest } from '../api/types';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  const visible = phone.slice(-3);
  return `***...${visible}`;
}

// ── Status Stepper ────────────────────────────────────────────────────────────

type ClassStatus = 'PENDING' | 'APPROVED' | 'MATCHED' | 'CANCELLED' | 'REJECTED';

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'PENDING', label: 'Chờ duyệt', description: 'Đang chờ Admin kiểm duyệt' },
  { id: 'APPROVED', label: 'Đang tìm gia sư', description: 'Lớp đã lên bảng tin công khai' },
  { id: 'MATCHED', label: 'Đã chốt gia sư', description: 'Gia sư đã nhận lớp' },
];

function getStepIndex(status: ClassStatus): number {
  switch (status) {
    case 'PENDING': return 0;
    case 'APPROVED': return 1;
    case 'MATCHED': return 2;
    default: return -1; // CANCELLED / REJECTED
  }
}

function isCancelled(status: ClassStatus): boolean {
  return status === 'CANCELLED' || status === 'REJECTED';
}

function StatusStepper({ status }: { status: ClassStatus }) {
  const cancelled = isCancelled(status);
  const activeIdx = getStepIndex(status);

  if (cancelled) {
    return (
      <div className='flex items-center gap-3 p-4 rounded-2xl border border-destructive/30 bg-destructive/5'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30 shrink-0'>
          <IconX size={20} className='text-destructive' />
        </div>
        <div>
          <p className='font-bold text-destructive text-sm'>Đã hủy</p>
          <p className='text-xs text-muted-foreground mt-0.5'>
            {status === 'REJECTED' ? 'Yêu cầu đã bị từ chối' : 'Yêu cầu đã bị hủy bởi phụ huynh/học sinh'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      {/* Desktop stepper */}
      <div className='hidden sm:flex items-center'>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div key={step.id} className='flex items-center flex-1 last:flex-none'>
              {/* Node */}
              <div className='flex flex-col items-center gap-1.5'>
                <div
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 shrink-0 z-10',
                    isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                    isActive && status === 'APPROVED' && 'bg-blue-500 border-blue-400 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]',
                    isActive && status === 'MATCHED' && 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]',
                    isActive && status === 'PENDING' && 'bg-muted border-border text-muted-foreground',
                    !isCompleted && !isActive && 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {/* Pulsing ring for APPROVED active */}
                  {isActive && status === 'APPROVED' && (
                    <span className='absolute inset-0 rounded-full bg-blue-400/20 animate-ping' />
                  )}
                  {isCompleted
                    ? <IconCheck size={16} />
                    : <span>{idx + 1}</span>
                  }
                </div>
                <div className='text-center'>
                  <p className={cn(
                    'text-xs font-semibold whitespace-nowrap',
                    isActive ? 'text-foreground' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  <p className='text-[10px] text-muted-foreground hidden md:block max-w-[100px]'>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-22px] transition-all duration-500',
                  idx < activeIdx ? 'bg-emerald-400' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className='flex sm:hidden flex-col gap-3'>
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          return (
            <div key={step.id} className='flex items-center gap-3'>
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold shrink-0',
                isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                isActive && status === 'APPROVED' && 'bg-blue-500 border-blue-400 text-white',
                isActive && status === 'PENDING' && 'bg-muted border-border text-muted-foreground',
                isActive && status === 'MATCHED' && 'bg-emerald-500 border-emerald-500 text-white',
                !isCompleted && !isActive && 'bg-muted/50 border-border/50 text-muted-foreground/50'
              )}>
                {isCompleted ? <IconCheck size={14} /> : idx + 1}
              </div>
              <div className='flex-1'>
                <p className={cn('text-sm font-semibold', isActive ? 'text-foreground' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground/60')}>
                  {step.label}
                </p>
                <p className='text-xs text-muted-foreground'>{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Info Card ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0'>
      <div className='mt-0.5 text-primary/70 shrink-0'>{icon}</div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs text-muted-foreground font-medium'>{label}</p>
        <p className='text-sm font-semibold text-foreground mt-0.5 truncate'>{value}</p>
      </div>
    </div>
  );
}

// ── Tutor Status Card ─────────────────────────────────────────────────────────

function TutorStatusCard({ data }: { data: ClassRequest }) {
  const status = data.status as ClassStatus;

  if (status === 'PENDING') {
    return (
      <div className='rounded-2xl border bg-card shadow-sm p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]'>
        <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center'>
          <IconLoader2 size={22} className='text-muted-foreground animate-spin' />
        </div>
        <p className='text-sm font-semibold text-foreground'>Đang chờ Admin duyệt</p>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          Yêu cầu của bạn đang được kiểm duyệt. Thường mất 1–2 giờ trong giờ hành chính.
        </p>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className='rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 shadow-sm p-5 flex flex-col gap-3'>
        <div className='flex items-center gap-2.5'>
          <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-700'>
            <IconUsers size={18} className='text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <p className='text-sm font-bold text-foreground'>Đang có gia sư ứng tuyển</p>
            <p className='text-xs text-muted-foreground'>Lớp đã lên bảng tin công khai</p>
          </div>
        </div>

        <div className='flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-100/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30'>
          <span className='text-2xl font-extrabold text-blue-600 dark:text-blue-400'>
            {data.totalApplicants ?? 0}
          </span>
          <span className='text-sm text-muted-foreground'>gia sư đã ứng tuyển</span>
        </div>

        <p className='text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3'>
          <strong>Muốn xem hồ sơ và lựa chọn gia sư phù hợp?</strong> Hãy tạo tài khoản bên dưới để
          truy cập đầy đủ thông tin gia sư và trực tiếp liên hệ với họ.
        </p>
      </div>
    );
  }

  if (status === 'MATCHED') {
    return (
      <div className='rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-900/10 dark:border-emerald-800/30 shadow-sm p-5 flex flex-col gap-3'>
        <div className='flex items-center gap-2.5'>
          <div className='h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700'>
            <IconUserCheck size={18} className='text-emerald-600 dark:text-emerald-400' />
          </div>
          <div>
            <p className='text-sm font-bold text-foreground'>Đã chốt gia sư!</p>
            <p className='text-xs text-muted-foreground'>Lớp đã được ghép đôi thành công</p>
          </div>
        </div>

        <div className='flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30'>
          <IconCheck size={18} className='text-emerald-600 dark:text-emerald-400 shrink-0' />
          <p className='text-sm font-semibold text-foreground'>
            Gia sư{' '}
            <span className='text-emerald-600 dark:text-emerald-400'>
              {data.targetTutorName ?? 'đã được chọn'}
            </span>{' '}
            đã nhận lớp này.
          </p>
        </div>

        <div className='text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3 space-y-1'>
          <p>
            Gia sư sẽ chủ động liên hệ với bạn qua số điện thoại{' '}
            <strong>{maskPhone(data.contactPhone)}</strong> trong vòng{' '}
            <strong>24h tới</strong> để sắp xếp lịch dạy thử.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className='rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]'>
        <div className='h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
          <IconX size={22} className='text-destructive' />
        </div>
        <p className='text-sm font-semibold text-foreground'>Yêu cầu đã bị hủy</p>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          {status === 'REJECTED'
            ? 'Yêu cầu không đáp ứng điều kiện và đã bị từ chối.'
            : 'Yêu cầu lớp học đã bị hủy.'}
        </p>
      </div>
    );
  }

  return null;
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

interface CtaBannerProps {
  contactPhone: string;
  contactName: string;
  contactEmail: string;
}

function CtaBanner({ contactPhone, contactName, contactEmail }: CtaBannerProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const validatePassword = (val: string): string => {
    if (!val) return 'Vui lòng nhập mật khẩu';
    if (val.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) { setPasswordError(err); return; }
    setPasswordError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: contactName,
          email: contactEmail,
          password,
          confirmPassword: password,  // tự động dùng cùng giá trị
        }),
      });
      const body = await res.json();
      if (res.ok && body.success !== false) {
        setRegistered(true);
      } else {
        setPasswordError(body.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch {
      setPasswordError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className='relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-900/10 dark:border-emerald-800/30 shadow-md p-6'>
        <div className='flex flex-col items-center text-center gap-3'>
          <div className='h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700'>
            <IconMailCheck size={28} className='text-emerald-600 dark:text-emerald-400' />
          </div>
          <div>
            <p className='font-bold text-base text-foreground'>Tài khoản đã được tạo!</p>
            <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
              Kiểm tra hộp thư <strong className='text-foreground'>{contactEmail}</strong> để xác thực tài khoản và bắt đầu quản lý lớp học.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className='relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-md p-6'>
      <div className='pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl' />

      <div className='relative flex flex-col gap-4'>
        <div className='flex items-start gap-3'>
          <div className='h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0'>
            <IconShieldCheck size={20} className='text-primary' />
          </div>
          <div>
            <h3 className='font-bold text-base text-foreground'>
              Bạn muốn liên hệ với gia sư hoặc xem hợp đồng?
            </h3>
            <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
              Số điện thoại{' '}
              <strong className='text-foreground'>{maskPhone(contactPhone)}</strong> của bạn
              đã được lưu sẵn. Chỉ cần đặt mật khẩu để sở hữu tài khoản quản lý lớp học!
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className='space-y-2'>
          <div className='flex gap-2 items-start'>
            {/* Password input */}
            <div className='flex-1 space-y-1'>
              <div className='relative'>
                <IconLock size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                <Input
                  id='new-password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Mật khẩu mới (ít nhất 8 ký tự)'
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(validatePassword(e.target.value));
                  }}
                  className={cn('pl-9 pr-10 h-10', passwordError && 'border-destructive focus-visible:ring-destructive/30')}
                  disabled={loading}
                  autoComplete='new-password'
                />
                {/* Eye toggle */}
                <button
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
              {/* Inline error */}
              {passwordError && (
                <p className='text-xs text-destructive flex items-center gap-1'>
                  <IconAlertCircle size={11} />
                  {passwordError}
                </p>
              )}
            </div>

            <Button type='submit' disabled={loading} className='h-10 gap-1.5 shrink-0 mt-0'>
              {loading && <IconLoader2 size={15} className='animate-spin' />}
              Tạo tài khoản ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Result Panel ──────────────────────────────────────────────────────────────

function ResultPanel({ data }: { data: ClassRequest }) {
  const status = data.status as ClassStatus;
  const showAddress = data.teachingMode !== 'ONLINE';
  const { user } = useAuthSession();

  // Chỉ hiện CTA tạo tài khoản khi: chưa có account (theo API) VÀ chưa đăng nhập
  const showCtaBanner = data.hasAccount === false && !user;

  return (
    <div className='space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Status Stepper */}
      <div className='rounded-2xl border bg-card shadow-sm p-5 space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='font-bold text-base text-foreground'>Tiến trình xử lý</h2>
          <div className='flex items-center gap-1.5 text-xs font-mono bg-muted rounded-full px-2.5 py-1 text-muted-foreground'>
            <IconHash size={11} />
            {data.id}
          </div>
        </div>
        <StatusStepper status={status} />
      </div>

      {/* Two-column info */}
      <div className='grid sm:grid-cols-2 gap-4'>
        {/* Card 1: Class Info */}
        <div className='rounded-2xl border bg-card shadow-sm p-5'>
          <h3 className='font-bold text-sm text-foreground mb-3 flex items-center gap-2'>
            <IconBook size={15} className='text-primary' />
            Thông tin lớp học
          </h3>
          <div>
            <InfoRow
              icon={<IconBook size={15} />}
              label='Môn học / Cấp độ'
              value={`${data.subjectName} — ${data.gradeLevel}`}
            />
            <InfoRow
              icon={<IconCurrencyDong size={15} />}
              label='Học phí đề xuất'
              value={
                data.proposedPrice
                  ? `${formatPrice(data.proposedPrice)} VNĐ/Giờ`
                  : 'Thỏa thuận'
              }
            />
            <InfoRow
              icon={<IconCalendar size={15} />}
              label='Lịch học'
              value={`${data.sessionsPerWeek} buổi/tuần`}
            />
            <InfoRow
              icon={<IconClock size={15} />}
              label='Thời lượng mỗi buổi'
              value={`${data.durationMinutes} phút/buổi`}
            />
            {showAddress && (
              <InfoRow
                icon={<IconMapPin size={15} />}
                label='Địa điểm'
                value={
                  <span>
                    {data.ward && <span>{data.ward}, </span>}
                    {data.province}{' '}
                    <span className='text-muted-foreground text-xs font-normal'>(Địa chỉ chi tiết đã ẩn)</span>
                  </span>
                }
              />
            )}
            {!showAddress && (
              <InfoRow
                icon={<IconMapPin size={15} />}
                label='Hình thức'
                value='Online (Trực tuyến)'
              />
            )}
          </div>
        </div>

        {/* Card 2: Tutor Status */}
        <TutorStatusCard data={data} />
      </div>

      {/* CTA Banner — chỉ hiển thị khi chưa có tài khoản VÀ chưa đăng nhập */}
      {showCtaBanner && (
        <CtaBanner
          contactPhone={data.contactPhone}
          contactName={data.contactName}
          contactEmail={data.contactEmail}
        />
      )}
    </div>
  );
}

// ── Search Form ───────────────────────────────────────────────────────────────

function SearchForm({
  onResult
}: {
  onResult: (data: ClassRequest) => void;
}) {
  const [classCode, setClassCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classCode.trim()) {
      setError('Vui lòng nhập mã lớp học');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Vui lòng nhập số điện thoại đăng ký');
      return;
    }

    setLoading(true);
    try {
      const res = await trackClassRequest({
        classCode: classCode.trim(),
        contactPhone: contactPhone.trim(),
      });
      if (res.success && res.data) {
        onResult(res.data);
      } else {
        setError(res.message || 'Không tìm thấy yêu cầu lớp học');
      }
    } catch (err: any) {
      setError(err?.message || 'Không tìm thấy yêu cầu lớp học khớp với thông tin đã nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-2xl border bg-card shadow-sm p-6 space-y-4'
    >
      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='track-class-code' className='text-sm font-semibold'>
            Mã lớp học <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <IconHash size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input
              id='track-class-code'
              placeholder='Ví dụ: TO260611...'
              value={classCode}
              onChange={e => {
                setClassCode(e.target.value);
                setError(null);
              }}
              className='pl-9 h-10 font-mono text-sm'
              disabled={loading}
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='track-phone' className='text-sm font-semibold'>
            Số điện thoại đăng ký <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <IconPhone size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input
              id='track-phone'
              type='tel'
              placeholder='0901 234 567'
              value={contactPhone}
              onChange={e => {
                setContactPhone(e.target.value);
                setError(null);
              }}
              className='pl-9 h-10'
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className='flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in duration-200'>
          <IconAlertCircle size={16} className='mt-0.5 shrink-0' />
          <span>{error}</span>
        </div>
      )}

      <Button
        type='submit'
        disabled={loading}
        className='w-full h-10 gap-2 font-semibold'
        id='track-submit-btn'
      >
        {loading ? (
          <>
            <IconLoader2 size={16} className='animate-spin' />
            Đang tra cứu...
          </>
        ) : (
          <>
            <IconSearch size={16} />
            Tra cứu ngay
          </>
        )}
      </Button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TrackClassPage() {
  const [result, setResult] = useState<ClassRequest | null>(null);

  const handleResult = (data: ClassRequest) => {
    setResult(data);
    // Scroll to result smoothly
    setTimeout(() => {
      document.getElementById('track-result')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    document.getElementById('track-class-code')?.focus();
  };

  return (
    <div className='space-y-6'>
      {/* Search Box */}
      <SearchForm onResult={handleResult} />

      {/* Result */}
      {result && (
        <div id='track-result' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-bold text-foreground'>Kết quả tra cứu</h2>
            <button
              type='button'
              onClick={handleReset}
              className='text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 underline underline-offset-2'
            >
              <IconSearch size={12} />
              Tra cứu lại
            </button>
          </div>
          <ResultPanel data={result} />
        </div>
      )}
    </div>
  );
}
