'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Tutor } from '@/constants/mock-api-tutors';
import {
  IconX,
  IconUser,
  IconPhone,
  IconMail,
  IconBook,
  IconSchool,
  IconMapPin,
  IconLoader2,
  IconCheck,
  IconCheckbox,
  IconSquare,
  IconSend,
  IconMessageCircle,
} from '@tabler/icons-react';
import Image from 'next/image';
import { getAvatarUrl, cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useReducer, useMemo, memo } from 'react';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import type { ClassRequest, ClassRequestDropdown } from '@/features/classes/api/types';
import type { Subject } from '@/features/subjects/api/types';
import { SearchableSelect } from '@/features/tutors/components/become-tutor/searchable-select';

// ── Static Options ────────────────────────────────────────────────────────────
const GRADE_LEVELS = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12',
  'Lớp 12 Ôn Thi Đại Học', 'Lớp 9 Ôn Thi vào cấp 3',
  'Đại học', 'Người đi làm',
];

const TEACHING_MODES = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline (Tại nhà)' },
  { value: 'HYBRID', label: 'Linh hoạt' },
] as const;

const SESSIONS_PER_WEEK = [1, 2, 3, 4, 5];
const DURATION_OPTIONS = [45, 60, 90, 120];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatVND = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(clean));
};
const parseVND = (v: string) => v.replace(/\D/g, '');

// ── Chip ─────────────────────────────────────────────────────────────────────
const Chip = memo(function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-all flex items-center gap-1',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'border-border hover:border-primary hover:text-primary text-muted-foreground',
      )}
    >
      {active ? (
        <IconCheckbox size={12} className='shrink-0' />
      ) : (
        <IconSquare size={12} className='shrink-0 opacity-50' />
      )}
      {children}
    </button>
  );
});

// ── Types for guest form ──────────────────────────────────────────────────────
interface SubjectSelection {
  id: number;
  name: string;
  proposedPrice: string;
}

interface GuestForm {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  gradeLevel: string;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'HYBRID' | '';
  sessionsPerWeek: number;
  durationMinutes: number;
  province: string;
  ward: string;
  addressDetail: string;
  studentNotes: string;
  message: string;
}

interface GuestFormState {
  form: GuestForm;
  errors: Record<string, string>;
}

type GuestFormAction =
  | { type: 'SET_FIELD'; key: keyof GuestForm; value: string | number }
  | { type: 'SET_PROVINCE'; name: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'RESET'; initial: GuestForm };

const EMPTY_GUEST: GuestForm = {
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  gradeLevel: '',
  teachingMode: '',
  sessionsPerWeek: 2,
  durationMinutes: 90,
  province: '',
  ward: '',
  addressDetail: '',
  studentNotes: '',
  message: '',
};

function guestReducer(state: GuestFormState, action: GuestFormAction): GuestFormState {
  switch (action.type) {
    case 'SET_FIELD': {
      const hasErr = !!state.errors[action.key as string];
      return {
        form: { ...state.form, [action.key]: action.value },
        errors: hasErr
          ? (({ [action.key as string]: _, ...rest }) => rest)(state.errors)
          : state.errors,
      };
    }
    case 'SET_PROVINCE':
      return {
        form: { ...state.form, province: action.name, ward: '' },
        errors: (({ province: _, ward: __, ...rest }) => rest)(state.errors),
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'RESET':
      return { form: action.initial, errors: {} };
    default:
      return state;
  }
}

// ── Tutor Summary Card ────────────────────────────────────────────────────────
function TutorSummaryCard({ tutor }: { tutor: Tutor }) {
  const fullName = `${tutor.first_name} ${tutor.last_name}`;
  const tutorCode = `GS${String(tutor.id).padStart(4, '0')}`;
  const occupation = tutor.age <= 26 ? 'Sinh viên' : 'Giáo viên';
  const avatar = getAvatarUrl(tutor.avatar_url);
  const fallback = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + tutor.id;
  return (
    <div className='flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3'>
      <div className='h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary/20 shrink-0'>
        <Image
          src={avatar || fallback}
          alt={fullName}
          width={40}
          height={40}
          className='h-full w-full object-cover'
          unoptimized
        />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-semibold text-foreground truncate'>
          {tutorCode}: {fullName}
        </p>
        <p className='text-xs text-muted-foreground truncate'>
          {occupation} · {tutor.province}
        </p>
      </div>
    </div>
  );
}

// ── ClassRequestLabel helpers ─────────────────────────────────────────────────
function formatClassRequestLabel(cr: ClassRequest): string {
  const mode =
    cr.teachingMode === 'ONLINE' ? 'Online' : cr.teachingMode === 'OFFLINE' ? 'Offline' : 'Linh hoạt';
  return `${cr.subjectName} · ${cr.gradeLevel} · ${mode}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE A: Modal đơn giản khi ĐÃ ĐĂNG NHẬP
// ═══════════════════════════════════════════════════════════════════════════════
function LoggedInInviteModal({
  tutor,
  onClose,
}: {
  tutor: Tutor;
  onClose: () => void;
}) {
  const { user } = useAuthSession();
  const [classRequests, setClassRequests] = useState<ClassRequestDropdown[]>([]);
  const [loadingCR, setLoadingCR] = useState(true);
  const [selectedCRId, setSelectedCRId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch user's class requests
  useEffect(() => {
    if (!user?.id) return;
    setLoadingCR(true);
    apiClient<{ success: boolean; data: ClassRequestDropdown[] }>(`/class-requests/my-dropdown`)
      .then((res) => {
        if (res.success) {
          setClassRequests(res.data ?? []);
        }
      })
      .catch(() => {
        setClassRequests([]);
      })
      .finally(() => setLoadingCR(false));
  }, [user?.id]);

  const crOptions = useMemo(
    () =>
      classRequests.map((cr) => {
        const priceStr = cr.proposedPrice > 0
          ? `${cr.proposedPrice.toLocaleString('vi-VN')} đ/tháng`
          : 'Thỏa thuận';
        return {
          value: String(cr.id),
          label: `[${cr.classCode}] ${cr.subjectName} - Lớp ${cr.gradeLevel} (${priceStr})`,
        };
      }),
    [classRequests],
  );

  const fullName = `${tutor.first_name} ${tutor.last_name}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errors: string[] = [];
    if (!selectedCRId) errors.push('Vui lòng chọn lớp học cần gia sư');
    if (!message.trim()) errors.push('Vui lòng nhập lời nhắn');

    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      await apiClient(`/tutors/${tutor.id}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          classRequestId: Number(selectedCRId),
          message: message.trim(),
        }),
      });
      toast.success(`Đã gửi lời mời đến gia sư ${fullName} thành công!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi gửi lời mời.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCR = classRequests.find((cr) => String(cr.id) === selectedCRId);

  return (
    <form onSubmit={handleSubmit} className='p-5 space-y-4'>
      {/* Tutor Summary */}
      <TutorSummaryCard tutor={tutor} />

      <p className='text-xs text-muted-foreground leading-normal'>
        Chọn lớp học của bạn và gửi lời nhắn — gia sư sẽ liên hệ xác nhận lịch dạy!
      </p>

      {/* Dropdown chọn class request */}
      <div className='space-y-1.5'>
        <Label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
          <IconBook size={13} className='text-muted-foreground' />
          Chọn lớp học của bạn <span className='text-destructive'>*</span>
        </Label>
        {loadingCR ? (
          <div className='flex items-center gap-2 text-muted-foreground text-xs h-10 border rounded-md px-3'>
            <IconLoader2 size={14} className='animate-spin' />
            Đang tải danh sách lớp học...
          </div>
        ) : crOptions.length === 0 ? (
          <div className='rounded-md border border-dashed px-4 py-3 text-xs text-muted-foreground text-center space-y-1'>
            <p>Bạn chưa có lớp học nào.</p>
            <a href='/post-class' className='text-primary font-medium hover:underline'>
              + Đăng lớp mới
            </a>
          </div>
        ) : (
          <SearchableSelect
            value={selectedCRId}
            onValueChange={setSelectedCRId}
            options={crOptions}
            placeholder='Chọn lớp học...'
          />
        )}
      </div>

      {/* Hiển thị thông tin lớp đã chọn */}
      {selectedCR && (
        <div className='rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-1.5 text-xs'>
          <div className='flex items-center gap-1.5 text-foreground font-semibold'>
            <IconCheck size={13} className='text-primary' />
            Thông tin lớp đã chọn
          </div>
          <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground'>
            <span>
              <span className='font-medium text-foreground'>Mã lớp:</span> {selectedCR.classCode}
            </span>
            <span>
              <span className='font-medium text-foreground'>Môn học:</span> {selectedCR.subjectName}
            </span>
            <span>
              <span className='font-medium text-foreground'>Cấp độ:</span> {selectedCR.gradeLevel}
            </span>
            <span>
              <span className='font-medium text-foreground'>Học phí:</span>{' '}
              {selectedCR.proposedPrice > 0
                ? `${selectedCR.proposedPrice.toLocaleString('vi-VN')} đ/tháng`
                : 'Thỏa thuận'}
            </span>
          </div>
        </div>
      )}

      {/* Ô nhập message */}
      <div className='space-y-1.5'>
        <Label htmlFor='invite-message-logged' className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
          <IconMessageCircle size={13} className='text-muted-foreground' />
          Lời nhắn đến gia sư <span className='text-destructive'>*</span>
        </Label>
        <Textarea
          id='invite-message-logged'
          disabled={submitting}
          placeholder='VD: Chào gia sư, em đang cần học Toán lớp 12 để ôn thi đại học. Mong gia sư có thể dạy vào buổi tối từ 19h-21h...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          className='resize-none text-sm'
        />
        <p className='text-right text-[10px] text-muted-foreground'>{message.length}/500</p>
      </div>

      {/* Buttons */}
      <div className='flex gap-3 pt-1'>
        <Button
          type='button'
          variant='outline'
          disabled={submitting}
          onClick={onClose}
          className='flex-1 h-10 cursor-pointer'
        >
          Hủy
        </Button>
        <Button
          type='submit'
          disabled={submitting || !selectedCRId || crOptions.length === 0}
          className='flex-1 h-10 cursor-pointer gap-1.5'
        >
          {submitting ? (
            <>
              <IconLoader2 size={15} className='animate-spin' />
              Đang gửi...
            </>
          ) : (
            <>
              <IconSend size={15} />
              Gửi lời mời
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE B: Modal đầy đủ khi CHƯA ĐĂNG NHẬP
// ═══════════════════════════════════════════════════════════════════════════════
function GuestInviteModal({ tutor, onClose }: { tutor: Tutor; onClose: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectSelection[]>([]);

  const [provinces, setProvinces] = useState<{ name: string; code: number }[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [districts, setDistricts] = useState<{ name: string; code: number }[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [state, dispatch] = useReducer(guestReducer, { form: EMPTY_GUEST, errors: {} });
  const { form, errors } = state;

  const fullName = `${tutor.first_name} ${tutor.last_name}`;

  // Fetch subjects
  useEffect(() => {
    apiClient<{ data: Subject[] }>('/subjects/tree')
      .then((res) => setSubjects(res.data || []))
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false));
  }, []);

  // Fetch provinces
  useEffect(() => {
    setLoadingProvinces(true);
    fetch('/api/provinces')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setProvinces(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => { })
      .finally(() => setLoadingProvinces(false));
  }, []);

  const selectedProvinceCode = useMemo(
    () => provinces.find((p) => p.name === form.province)?.code.toString() || '',
    [provinces, form.province],
  );

  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    fetch(`/api/provinces?code=${selectedProvinceCode}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list = data.districts || data.wards || [];
        setDistricts(Array.isArray(list) ? list : []);
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvinceCode]);

  const updateForm = useCallback((key: keyof GuestForm, value: string | number) => {
    dispatch({ type: 'SET_FIELD', key, value });
  }, []);

  const handleProvinceChange = useCallback(
    (code: string) => {
      const name = provinces.find((p) => p.code.toString() === code)?.name || '';
      dispatch({ type: 'SET_PROVINCE', name });
    },
    [provinces],
  );

  const handleDistrictChange = useCallback(
    (code: string) => {
      const name = districts.find((d) => d.code.toString() === code)?.name || '';
      dispatch({ type: 'SET_FIELD', key: 'ward', value: name });
    },
    [districts],
  );

  const toggleSubject = useCallback((sub: Pick<Subject, 'id' | 'name'>) => {
    setSelectedSubjects((prev) => {
      const exists = prev.find((s) => s.id === sub.id);
      if (exists) return prev.filter((s) => s.id !== sub.id);
      return [...prev, { id: sub.id, name: sub.name, proposedPrice: '' }];
    });
  }, []);

  const setSubjectPrice = useCallback((id: number, price: string) => {
    setSelectedSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, proposedPrice: price } : s)));
  }, []);

  const validate = (f: GuestForm, subjCount: number) => {
    const errs: Record<string, string> = {};
    if (!f.contactName.trim()) errs.contactName = 'Vui lòng nhập họ tên';
    if (!f.contactPhone.trim()) errs.contactPhone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9+\s\-()]{9,15}$/.test(f.contactPhone.trim()))
      errs.contactPhone = 'Số điện thoại không hợp lệ';
    if (!f.contactEmail.trim()) errs.contactEmail = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail.trim()))
      errs.contactEmail = 'Email không hợp lệ';
    if (subjCount === 0) errs.subjects = 'Vui lòng chọn ít nhất 1 môn học';
    if (!f.gradeLevel) errs.gradeLevel = 'Vui lòng chọn cấp độ';
    if (!f.teachingMode) errs.teachingMode = 'Vui lòng chọn hình thức học';
    return errs;
  };

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ value: p.code.toString(), label: p.name })),
    [provinces],
  );
  const districtOptions = useMemo(
    () => districts.map((d) => ({ value: d.code.toString(), label: d.name })),
    [districts],
  );
  const selectedDistrictCode = useMemo(
    () => districts.find((d) => d.name === form.ward)?.code.toString() || '',
    [districts, form.ward],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form, selectedSubjects.length);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs });
      // scroll to first error
      setTimeout(() => {
        const el = document.querySelector('[data-invite-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setSubmitting(true);
    try {
      const addressDetail = [form.addressDetail, form.ward, form.province].filter(Boolean).join(', ');
      const requests = selectedSubjects.map((sub) => ({
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        subjectId: sub.id,
        gradeLevel: form.gradeLevel,
        proposedPrice: sub.proposedPrice ? parseFloat(sub.proposedPrice) : undefined,
        teachingMode: form.teachingMode,
        sessionsPerWeek: form.sessionsPerWeek,
        durationMinutes: form.durationMinutes,
        addressDetail: addressDetail || undefined,
        studentNotes: form.studentNotes.trim() || undefined,
        targetTutorId: tutor.id,
        message: form.message.trim() || undefined,
      }));

      await apiClient(`/class-requests/bulk`, {
        method: 'POST',
        body: JSON.stringify({ requests }),
      });
      toast.success(`Đã gửi yêu cầu đến gia sư ${fullName} thành công!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const isOnline = form.teachingMode === 'ONLINE';

  return (
    <form onSubmit={handleSubmit} className='p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-60px)]'>
      {/* Tutor Summary */}
      <TutorSummaryCard tutor={tutor} />

      <p className='text-xs text-muted-foreground leading-normal'>
        Điền thông tin để gửi yêu cầu — gia sư sẽ liên hệ với bạn trong vòng 24 giờ!
      </p>

      {/* ── STEP 1: Contact ── */}
      <fieldset className='rounded-xl border bg-card p-4 space-y-3'>
        <legend className='text-xs font-bold px-1 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <IconUser size={12} />
          Thông tin liên hệ
        </legend>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='space-y-1'>
            <Label htmlFor='g-name' className='text-xs font-semibold'>
              Họ và tên <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='g-name'
              placeholder='Nguyễn Văn A'
              value={form.contactName}
              onChange={(e) => updateForm('contactName', e.target.value)}
              disabled={submitting}
              className={cn('h-9 text-sm', errors.contactName && 'border-destructive')}
            />
            {errors.contactName && (
              <p data-invite-error='true' className='text-[11px] text-destructive'>
                {errors.contactName}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='g-phone' className='text-xs font-semibold'>
              Số điện thoại <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <IconPhone size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
              <Input
                id='g-phone'
                type='tel'
                placeholder='0901 234 567'
                value={form.contactPhone}
                onChange={(e) => updateForm('contactPhone', e.target.value)}
                disabled={submitting}
                className={cn('h-9 pl-8 text-sm', errors.contactPhone && 'border-destructive')}
              />
            </div>
            {errors.contactPhone && (
              <p data-invite-error='true' className='text-[11px] text-destructive'>
                {errors.contactPhone}
              </p>
            )}
          </div>

          <div className='space-y-1 sm:col-span-2'>
            <Label htmlFor='g-email' className='text-xs font-semibold'>
              Email <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <IconMail size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
              <Input
                id='g-email'
                type='email'
                placeholder='example@gmail.com'
                value={form.contactEmail}
                onChange={(e) => updateForm('contactEmail', e.target.value)}
                disabled={submitting}
                className={cn('h-9 pl-8 text-sm', errors.contactEmail && 'border-destructive')}
              />
            </div>
            {errors.contactEmail && (
              <p data-invite-error='true' className='text-[11px] text-destructive'>
                {errors.contactEmail}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── STEP 2: Subjects ── */}
      <fieldset className='rounded-xl border bg-card p-4 space-y-3'>
        <legend className='text-xs font-bold px-1 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <IconBook size={12} />
          Môn học cần học
        </legend>

        {errors.subjects && (
          <p data-invite-error='true' className='text-[11px] text-destructive'>
            {errors.subjects}
          </p>
        )}

        {subjectsLoading ? (
          <div className='flex items-center gap-2 text-muted-foreground text-xs'>
            <IconLoader2 size={13} className='animate-spin' /> Đang tải...
          </div>
        ) : (
          <div className='space-y-3'>
            {subjects.map((parent) => (
              <div key={parent.id}>
                {parent.children && parent.children.length > 0 ? (
                  <>
                    <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
                      {parent.name}
                    </p>
                    <div className='flex flex-wrap gap-1.5'>
                      {parent.children.map((child) => (
                        <Chip
                          key={child.id}
                          active={selectedSubjects.some((s) => s.id === child.id)}
                          onClick={() => toggleSubject(child)}
                        >
                          {child.name}
                        </Chip>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className='flex flex-wrap gap-1.5'>
                    <Chip
                      active={selectedSubjects.some((s) => s.id === parent.id)}
                      onClick={() => toggleSubject(parent)}
                    >
                      {parent.name}
                    </Chip>
                  </div>
                )}
              </div>
            ))}

            {selectedSubjects.length > 0 && (
              <div className='rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2'>
                <p className='text-xs font-semibold text-foreground'>Học phí đề xuất (VNĐ/tháng, tùy chọn)</p>
                <div className='space-y-2'>
                  {selectedSubjects.map((sub) => (
                    <div key={sub.id} className='flex items-center gap-2'>
                      <Badge variant='secondary' className='shrink-0 text-[10px] px-2 py-0.5 min-w-[70px] justify-center'>
                        {sub.name}
                      </Badge>
                      <div className='relative flex-1'>
                        <Input
                          type='text'
                          placeholder='VD: 500.000'
                          value={formatVND(sub.proposedPrice)}
                          onChange={(e) => setSubjectPrice(sub.id, parseVND(e.target.value))}
                          className='h-7 text-xs pr-8'
                        />
                        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none'>₫</span>
                      </div>
                      <button
                        type='button'
                        onClick={() => toggleSubject({ id: sub.id, name: sub.name })}
                        className='text-muted-foreground hover:text-destructive transition-colors'
                      >
                        <IconX size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* ── STEP 3: Class Details ── */}
      <fieldset className='rounded-xl border bg-card p-4 space-y-3'>
        <legend className='text-xs font-bold px-1 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
          <IconSchool size={12} />
          Chi tiết lớp học
        </legend>

        <div className='space-y-2'>
          <p className='text-xs font-semibold'>
            Cấp độ / Lớp học <span className='text-destructive'>*</span>
          </p>
          {errors.gradeLevel && (
            <p data-invite-error='true' className='text-[11px] text-destructive'>
              {errors.gradeLevel}
            </p>
          )}
          <div className='flex flex-wrap gap-1.5'>
            {GRADE_LEVELS.map((l) => (
              <Chip key={l} active={form.gradeLevel === l} onClick={() => updateForm('gradeLevel', l)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-xs font-semibold'>
            Hình thức học <span className='text-destructive'>*</span>
          </p>
          {errors.teachingMode && (
            <p data-invite-error='true' className='text-[11px] text-destructive'>
              {errors.teachingMode}
            </p>
          )}
          <div className='flex flex-wrap gap-1.5'>
            {TEACHING_MODES.map((m) => (
              <Chip
                key={m.value}
                active={form.teachingMode === m.value}
                onClick={() => updateForm('teachingMode', m.value)}
              >
                {m.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <p className='text-xs font-semibold'>Số buổi / tuần</p>
            <div className='flex flex-wrap gap-1.5'>
              {SESSIONS_PER_WEEK.map((n) => (
                <button
                  key={n}
                  type='button'
                  onClick={() => updateForm('sessionsPerWeek', n)}
                  className={cn(
                    'h-8 w-8 rounded-lg border text-xs font-bold transition-all',
                    form.sessionsPerWeek === n
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-1.5'>
            <p className='text-xs font-semibold'>Thời lượng / buổi</p>
            <div className='flex flex-wrap gap-1.5'>
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type='button'
                  onClick={() => updateForm('durationMinutes', d)}
                  className={cn(
                    'h-8 px-2 rounded-lg border text-xs font-bold transition-all',
                    form.durationMinutes === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary',
                  )}
                >
                  {d}'
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── STEP 4: Location (ẩn khi ONLINE) ── */}
      {!isOnline && (
        <fieldset className='rounded-xl border bg-card p-4 space-y-3'>
          <legend className='text-xs font-bold px-1 text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
            <IconMapPin size={12} />
            Địa điểm học
          </legend>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs font-semibold flex items-center gap-1'>
                Tỉnh / Thành phố
                {loadingProvinces && <IconLoader2 size={11} className='animate-spin text-primary' />}
              </Label>
              <SearchableSelect
                value={selectedProvinceCode}
                onValueChange={handleProvinceChange}
                options={provinceOptions}
                placeholder='Chọn tỉnh/TP'
                disabled={loadingProvinces}
              />
            </div>

            <div className='space-y-1'>
              <Label className='text-xs font-semibold flex items-center gap-1'>
                Xã / Phường
                {loadingDistricts && <IconLoader2 size={11} className='animate-spin text-primary' />}
              </Label>
              <SearchableSelect
                value={selectedDistrictCode}
                onValueChange={handleDistrictChange}
                options={districtOptions}
                placeholder='Chọn xã/phường'
                disabled={loadingDistricts || !selectedProvinceCode}
              />
            </div>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='g-addr' className='text-xs font-semibold'>
              Địa chỉ cụ thể
            </Label>
            <Input
              id='g-addr'
              placeholder='Số nhà, tên đường...'
              value={form.addressDetail}
              onChange={(e) => updateForm('addressDetail', e.target.value)}
              className='h-9 text-sm'
            />
          </div>
        </fieldset>
      )}

      {/* ── STEP 5: Lời nhắn ── */}
      <div className='space-y-1.5'>
        <Label htmlFor='g-message' className='text-xs font-semibold flex items-center gap-1.5'>
          <IconMessageCircle size={13} className='text-muted-foreground' />
          Lời nhắn & ghi chú
        </Label>
        <Textarea
          id='g-message'
          placeholder='VD: Cháu mất gốc Toán, cần gia sư kiên nhẫn. Muốn học buổi tối 19h-21h...'
          value={form.studentNotes}
          onChange={(e) => updateForm('studentNotes', e.target.value)}
          rows={3}
          maxLength={500}
          disabled={submitting}
          className='resize-none text-sm'
        />
        <p className='text-right text-[10px] text-muted-foreground'>{form.studentNotes.length}/500</p>
      </div>

      {/* Buttons */}
      <div className='flex gap-3'>
        <Button
          type='button'
          variant='outline'
          disabled={submitting}
          onClick={onClose}
          className='flex-1 h-10 cursor-pointer'
        >
          Hủy
        </Button>
        <Button
          type='submit'
          disabled={submitting}
          className='flex-1 h-10 cursor-pointer gap-1.5'
        >
          {submitting ? (
            <>
              <IconLoader2 size={15} className='animate-spin' />
              Đang gửi...
            </>
          ) : (
            <>
              <IconSend size={15} />
              Gửi yêu cầu
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: TutorInviteModal (router component)
// ═══════════════════════════════════════════════════════════════════════════════
interface TutorInviteModalProps {
  tutor: Tutor | null;
  open: boolean;
  onClose: () => void;
}

export function TutorInviteModal({ tutor, open, onClose }: TutorInviteModalProps) {
  const { user, loading } = useAuthSession();

  if (!tutor) return null;

  const fullName = `${tutor.first_name} ${tutor.last_name}`;
  const isLoggedIn = !loading && !!user;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className='flex w-[95vw] max-w-lg flex-col overflow-hidden rounded-xl border bg-background p-0 gap-0 shadow-2xl [&>button]:hidden'
        hideCloseButton
      >
        <DialogTitle className='sr-only'>
          {isLoggedIn ? 'Gửi lời mời gia sư' : 'Mời gia sư dạy học'} — {fullName}
        </DialogTitle>

        {/* Header */}
        <header className='flex shrink-0 items-center justify-between px-5 py-3.5 bg-primary text-primary-foreground'>
          <div>
            <span className='font-bold text-sm tracking-wide'>
              {isLoggedIn ? 'Gửi lời mời gia sư' : 'Mời gia sư dạy học'}
            </span>
            {!isLoggedIn && (
              <p className='text-[11px] text-primary-foreground/70 mt-0.5'>
                Điền thông tin để tạo yêu cầu lớp học
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Đóng'
            className='rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer'
          >
            <IconX size={17} />
          </button>
        </header>

        {/* Loading skeleton while checking auth */}
        {loading ? (
          <div className='p-5 space-y-3'>
            <div className='h-12 rounded-xl bg-muted animate-pulse' />
            <div className='h-9 rounded-lg bg-muted animate-pulse' />
            <div className='h-24 rounded-lg bg-muted animate-pulse' />
          </div>
        ) : isLoggedIn ? (
          <LoggedInInviteModal tutor={tutor} onClose={onClose} />
        ) : (
          <GuestInviteModal tutor={tutor} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
