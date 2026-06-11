'use client';

import { useState, useEffect, useMemo, useCallback, useReducer, memo } from 'react';
import {
  IconBook,
  IconMapPin,
  IconCurrencyDong,
  IconCalendar,
  IconAlignLeft,
  IconCheck,
  IconSend,
  IconUser,
  IconPhone,
  IconMail,
  IconSchool,
  IconClock,
  IconLoader2,
  IconX,
  IconCheckbox,
  IconSquare,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Subject } from '@/features/subjects/api/types';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { SearchableSelect } from '@/features/tutors/components/become-tutor/searchable-select';

// ── Static Options ────────────────────────────────────────────────────────────
const GRADE_LEVELS = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12',
  'Lớp 12 Ôn Thi Đại Học', 'Lớp 9 Ôn Thi vào cấp 3',
  'Đại học', 'Người đi làm'
];

const TEACHING_MODES = [
  { value: 'ONLINE', label: 'Online (Trực tuyến)' },
  { value: 'OFFLINE', label: 'Offline (Tại nhà)' },
  { value: 'HYBRID', label: 'Linh hoạt (Cả hai)' },
] as const;

const SESSIONS_PER_WEEK = [1, 2, 3, 4, 5];
const DURATION_OPTIONS = [45, 60, 90, 120];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatVND = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(cleanValue));
};

const parseVND = (formattedValue: string): string =>
  formattedValue.replace(/\D/g, '');

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubjectSelection {
  id: number;
  name: string;
  proposedPrice: string;
}

interface FormData {
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
}

// ── useReducer: gộp form + errors vào 1 state → 1 render mỗi keystroke ────────
interface FormState {
  form: FormData;
  errors: Record<string, string>;
}

type FormAction =
  | { type: 'SET_FIELD'; key: keyof FormData; value: string | number }
  | { type: 'SET_PROVINCE'; name: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ERROR'; key: string }
  | { type: 'RESET'; initialForm: FormData };

const EMPTY_FORM: FormData = {
  contactName: '', contactPhone: '', contactEmail: '',
  gradeLevel: '', teachingMode: '', sessionsPerWeek: 2,
  durationMinutes: 90, province: '', ward: '', addressDetail: '',
  studentNotes: '',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': {
      const hasError = !!state.errors[action.key as string];
      return {
        form: { ...state.form, [action.key]: action.value },
        // Xóa error cùng lúc với update field → chỉ 1 render
        errors: hasError
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
    case 'CLEAR_ERROR': {
      if (!state.errors[action.key]) return state;
      const { [action.key]: _, ...rest } = state.errors;
      return { ...state, errors: rest };
    }
    case 'RESET':
      return { form: action.initialForm, errors: {} };
    default:
      return state;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Section = memo(function Section({
  title, icon, children, step, completed
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  step: number;
  completed?: boolean;
}) {
  return (
    <div className='rounded-2xl border bg-card shadow-sm overflow-hidden'>
      <div className={cn(
        'flex items-center gap-3 px-6 py-4 border-b',
        completed ? 'bg-primary/5' : 'bg-muted/30'
      )}>
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0',
          completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border'
        )}>
          {completed ? <IconCheck size={16} /> : step}
        </div>
        <div className='flex items-center gap-2 flex-1'>
          <span className={cn('text-primary', completed && 'text-primary')}>{icon}</span>
          <h2 className='font-bold text-base'>{title}</h2>
        </div>
        {completed && (
          <Badge variant='secondary' className='text-xs bg-primary/10 text-primary border-primary/20'>
            Đã điền
          </Badge>
        )}
      </div>
      <div className='p-6'>{children}</div>
    </div>
  );
});

const Chip = memo(function Chip({
  active, onClick, children
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 flex items-center gap-1.5',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'border-border hover:border-primary hover:text-primary text-muted-foreground'
      )}
    >
      {active
        ? <IconCheckbox size={14} className='shrink-0' />
        : <IconSquare size={14} className='shrink-0 opacity-50' />
      }
      {children}
    </button>
  );
});

// ── Step 1: Contact ───────────────────────────────────────────────────────────
interface ContactSectionProps {
  form: Pick<FormData, 'contactName' | 'contactPhone' | 'contactEmail'>;
  errors: Record<string, string>;
  onChange: (key: keyof FormData, value: string) => void;
}

const ContactSection = memo(function ContactSection({ form, errors, onChange }: ContactSectionProps) {
  const completed = !!(form.contactName && form.contactPhone && form.contactEmail);
  return (
    <Section title='Thông tin liên hệ' icon={<IconUser size={18} />} step={1} completed={completed}>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='contact-name' className='text-sm font-semibold'>
            Họ và tên <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='contact-name'
            placeholder='Nguyễn Văn A'
            value={form.contactName}
            onChange={e => onChange('contactName', e.target.value)}
            className={cn('h-10', errors.contactName && 'border-destructive focus-visible:ring-destructive/30')}
          />
          {errors.contactName && <p className='text-xs text-destructive' data-error='true'>{errors.contactName}</p>}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='contact-phone' className='text-sm font-semibold'>
            Số điện thoại <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <IconPhone size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input
              id='contact-phone'
              type='tel'
              placeholder='0901 234 567'
              value={form.contactPhone}
              onChange={e => onChange('contactPhone', e.target.value)}
              className={cn('h-10 pl-9', errors.contactPhone && 'border-destructive focus-visible:ring-destructive/30')}
            />
          </div>
          {errors.contactPhone && <p className='text-xs text-destructive'>{errors.contactPhone}</p>}
        </div>

        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='contact-email' className='text-sm font-semibold'>
            Email <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <IconMail size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none' />
            <Input
              id='contact-email'
              type='email'
              placeholder='example@gmail.com'
              value={form.contactEmail}
              onChange={e => onChange('contactEmail', e.target.value)}
              className={cn('h-10 pl-9', errors.contactEmail && 'border-destructive focus-visible:ring-destructive/30')}
            />
          </div>
          {errors.contactEmail && <p className='text-xs text-destructive'>{errors.contactEmail}</p>}
        </div>
      </div>
    </Section>
  );
});

// ── Step 2: Subjects ──────────────────────────────────────────────────────────
interface SubjectsSectionProps {
  subjects: Subject[];
  subjectsLoading: boolean;
  selectedSubjects: SubjectSelection[];
  errors: Record<string, string>;
  onToggle: (sub: Pick<Subject, 'id' | 'name'>) => void;
  onPriceChange: (id: number, price: string) => void;
}

const SubjectsSection = memo(function SubjectsSection({
  subjects, subjectsLoading, selectedSubjects, errors, onToggle, onPriceChange,
}: SubjectsSectionProps) {
  const completed = selectedSubjects.length > 0;
  return (
    <Section title='Môn học cần học' icon={<IconBook size={18} />} step={2} completed={completed}>
      {subjectsLoading ? (
        <div className='flex items-center gap-2 text-muted-foreground text-sm'>
          <IconLoader2 size={16} className='animate-spin' /> Đang tải danh sách môn học...
        </div>
      ) : (
        <div className='space-y-5'>
          <div>
            <p className='text-sm font-semibold mb-3'>
              Chọn một hoặc nhiều môn <span className='text-destructive'>*</span>
            </p>
            {errors.subjects && (
              <p className='text-xs text-destructive mb-2' data-error='true'>{errors.subjects}</p>
            )}
            {subjects.length > 0 ? (
              <div className='space-y-4'>
                {subjects.map(parent => (
                  <div key={parent.id}>
                    {parent.children && parent.children.length > 0 ? (
                      <>
                        <p className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                          <span className='w-4 h-0.5 bg-muted-foreground/40 inline-block' />
                          {parent.name}
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {parent.children.map(child => (
                            <Chip
                              key={child.id}
                              active={selectedSubjects.some(s => s.id === child.id)}
                              onClick={() => onToggle(child)}
                            >
                              {child.name}
                            </Chip>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className='flex flex-wrap gap-2'>
                        <Chip
                          active={selectedSubjects.some(s => s.id === parent.id)}
                          onClick={() => onToggle(parent)}
                        >
                          {parent.name}
                        </Chip>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {['Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'Tiếng Anh', 'Lịch Sử', 'Địa Lý', 'Tin Học'].map(name => (
                  <Chip key={name} active={false} onClick={() => { }}>
                    {name}
                  </Chip>
                ))}
              </div>
            )}
          </div>

          {selectedSubjects.length > 0 && (
            <div className='rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3'>
              <p className='text-sm font-semibold text-foreground flex items-center gap-2'>
                <IconCurrencyDong size={16} className='text-primary' />
                Học phí đề xuất theo môn <span className='text-muted-foreground text-xs font-normal'>(tùy chọn, VNĐ/tháng)</span>
              </p>
              <div className='grid gap-3 sm:grid-cols-2'>
                {selectedSubjects.map(sub => (
                  <SubjectPriceRow
                    key={sub.id}
                    sub={sub}
                    onPriceChange={onPriceChange}
                    onRemove={onToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
});

// ── Step 3: Class Details ─────────────────────────────────────────────────────
interface ClassDetailsSectionProps {
  gradeLevel: string;
  teachingMode: FormData['teachingMode'];
  sessionsPerWeek: number;
  durationMinutes: number;
  errors: Record<string, string>;
  onChange: (key: keyof FormData, value: string | number) => void;
}

const ClassDetailsSection = memo(function ClassDetailsSection({
  gradeLevel, teachingMode, sessionsPerWeek, durationMinutes, errors, onChange,
}: ClassDetailsSectionProps) {
  const completed = !!(gradeLevel && teachingMode);
  return (
    <Section title='Chi tiết lớp học' icon={<IconSchool size={18} />} step={3} completed={completed}>
      <div className='space-y-5'>
        <div>
          <Label className='text-sm font-semibold mb-3 block'>
            Cấp độ / Lớp học <span className='text-destructive'>*</span>
          </Label>
          {errors.gradeLevel && (
            <p className='text-xs text-destructive mb-2' data-error='true'>{errors.gradeLevel}</p>
          )}
          <div className='flex flex-wrap gap-2'>
            {GRADE_LEVELS.map(l => (
              <Chip key={l} active={gradeLevel === l} onClick={() => onChange('gradeLevel', l)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label className='text-sm font-semibold mb-3 block'>
            Hình thức học <span className='text-destructive'>*</span>
          </Label>
          {errors.teachingMode && (
            <p className='text-xs text-destructive mb-2' data-error='true'>{errors.teachingMode}</p>
          )}
          <div className='flex flex-wrap gap-2'>
            {TEACHING_MODES.map(m => (
              <Chip key={m.value} active={teachingMode === m.value} onClick={() => onChange('teachingMode', m.value)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className='grid sm:grid-cols-2 gap-4'>
          <div>
            <Label className='text-sm font-semibold mb-2 block flex items-center gap-1.5'>
              <IconCalendar size={14} className='text-muted-foreground' />
              Số buổi / tuần
            </Label>
            <div className='flex flex-wrap gap-2'>
              {SESSIONS_PER_WEEK.map(n => (
                <button
                  key={n} type='button'
                  onClick={() => onChange('sessionsPerWeek', n)}
                  className={cn(
                    'h-9 w-9 rounded-lg border text-sm font-bold transition-all',
                    sessionsPerWeek === n
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className='text-sm font-semibold mb-2 block flex items-center gap-1.5'>
              <IconClock size={14} className='text-muted-foreground' />
              Thời lượng / buổi
            </Label>
            <div className='flex flex-wrap gap-2'>
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d} type='button'
                  onClick={() => onChange('durationMinutes', d)}
                  className={cn(
                    'h-9 px-3 rounded-lg border text-sm font-bold transition-all',
                    durationMinutes === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  )}
                >
                  {d} phút
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
});

// ── Step 4: Location ──────────────────────────────────────────────────────────
interface LocationSectionProps {
  province: string;
  ward: string;
  addressDetail: string;
  teachingMode: FormData['teachingMode'];
  provinces: { name: string; code: number }[];
  districts: { name: string; code: number }[];
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  onProvinceChange: (code: string) => void;
  onDistrictChange: (code: string) => void;
  onChange: (key: keyof FormData, value: string) => void;
}

const LocationSection = memo(function LocationSection({
  province, ward, addressDetail, teachingMode,
  provinces, districts, loadingProvinces, loadingDistricts,
  onProvinceChange, onDistrictChange, onChange,
}: LocationSectionProps) {
  const isOnline = teachingMode === 'ONLINE';
  // Khi ONLINE: coi như đã hoàn thành (không cần địa chỉ)
  const completed = isOnline || !!(province && ward);

  const provinceOptions = useMemo(
    () => provinces.map(p => ({ value: p.code.toString(), label: p.name })),
    [provinces]
  );

  const selectedProvinceCode = useMemo(
    () => provinces.find(p => p.name === province)?.code.toString() || '',
    [provinces, province]
  );

  const districtOptions = useMemo(
    () => districts.map(d => ({ value: d.code.toString(), label: d.name })),
    [districts]
  );

  const selectedDistrictCode = useMemo(
    () => districts.find(d => d.name === ward)?.code.toString() || '',
    [districts, ward]
  );

  return (
    <Section
      title='Địa điểm học'
      icon={<IconMapPin size={18} />}
      step={4}
      completed={completed}
    >
      {isOnline ? (
        // Khi ONLINE: ẩn form địa chỉ, hiển thị thông báo
        <p className='text-sm text-foreground rounded-lg p-4 flex items-center gap-2'>
          Hình thức Online — không cần nhập địa chỉ.
        </p>
      ) : (
        <div className='space-y-4'>
          <div className='grid sm:grid-cols-2 gap-4'>
            <div className='space-y-1.5 flex flex-col'>
              <Label className='text-sm font-semibold flex items-center gap-1.5 mb-1.5'>
                Tỉnh / Thành phố
                {loadingProvinces && <IconLoader2 size={14} className='animate-spin text-primary' />}
              </Label>
              <SearchableSelect
                value={selectedProvinceCode}
                onValueChange={onProvinceChange}
                options={provinceOptions}
                placeholder='Chọn tỉnh/thành phố'
                disabled={loadingProvinces}
              />
            </div>

            <div className='space-y-1.5 flex flex-col'>
              <Label className='text-sm font-semibold flex items-center gap-1.5 mb-1.5'>
                Xã / Phường
                {loadingDistricts && <IconLoader2 size={14} className='animate-spin text-primary' />}
              </Label>
              <SearchableSelect
                value={selectedDistrictCode}
                onValueChange={onDistrictChange}
                options={districtOptions}
                placeholder='Chọn xã/phường'
                disabled={loadingDistricts || !selectedProvinceCode}
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='address-detail' className='text-sm font-semibold'>
              Địa chỉ cụ thể <span className='text-muted-foreground text-xs font-normal'>(số nhà, tên đường)</span>
            </Label>
            <Input
              id='address-detail'
              placeholder='VD: Số 123 Đường Nguyễn Huệ'
              value={addressDetail}
              onChange={e => onChange('addressDetail', e.target.value)}
              className='h-10'
            />
          </div>
        </div>
      )}
    </Section>
  );
});

// ── Step 5: Notes ─────────────────────────────────────────────────────────────
interface NotesSectionProps {
  value: string;
  onChange: (key: keyof FormData, value: string) => void;
}

const NotesSection = memo(function NotesSection({ value, onChange }: NotesSectionProps) {
  return (
    <Section
      title='Yêu cầu & Mô tả thêm'
      icon={<IconAlignLeft size={18} />}
      step={5}
      completed={value.length > 0}
    >
      <div className='space-y-1.5'>
        <Label htmlFor='student-notes' className='text-sm font-semibold'>
          Ghi chú cho gia sư <span className='text-muted-foreground text-xs font-normal'>(tùy chọn)</span>
        </Label>
        <Textarea
          id='student-notes'
          placeholder='Ví dụ: Học sinh mất gốc phần đại số, cần gia sư kiên nhẫn và có kinh nghiệm luyện thi THPT. Muốn học vào buổi tối từ 19h-21h...'
          rows={4}
          value={value}
          onChange={e => onChange('studentNotes', e.target.value)}
          maxLength={500}
        />
        <p className='text-xs text-muted-foreground text-right'>{value.length}/500</p>
      </div>
    </Section>
  );
});

// ── SubjectPriceRow ───────────────────────────────────────────────────────────
interface SubjectPriceRowProps {
  sub: SubjectSelection;
  onPriceChange: (id: number, price: string) => void;
  onRemove: (sub: Pick<Subject, 'id' | 'name'>) => void;
}

const SubjectPriceRow = memo(function SubjectPriceRow({ sub, onPriceChange, onRemove }: SubjectPriceRowProps) {
  return (
    <div className='flex items-center gap-2'>
      <Badge variant='secondary' className='shrink-0 text-xs px-2 py-1 min-w-[80px] justify-center'>
        {sub.name}
      </Badge>
      <div className='relative flex-1'>
        <Input
          type='text'
          placeholder='VD: 500.000'
          value={formatVND(sub.proposedPrice)}
          onChange={e => onPriceChange(sub.id, parseVND(e.target.value))}
          className='h-8 text-sm pr-10'
        />
        <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none'>₫</span>
      </div>
      <button
        type='button'
        onClick={() => onRemove({ id: sub.id, name: sub.name })}
        className='text-muted-foreground hover:text-destructive transition-colors'
        aria-label={`Xóa ${sub.name}`}
      >
        <IconX size={14} />
      </button>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function PostClassPage() {
  const { user } = useAuthSession();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [provinces, setProvinces] = useState<{ name: string; code: number }[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [districts, setDistricts] = useState<{ name: string; code: number }[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // FIX: useReducer thay thế useState(form) + useState(errors)
  // → SET_FIELD dispatch update form và clear error trong 1 render duy nhất
  const [state, dispatch] = useReducer(formReducer, undefined, () => ({
    form: {
      ...EMPTY_FORM,
      contactName: user?.fullName ?? '',
      contactEmail: user?.email ?? '',
    },
    errors: {},
  }));

  const { form, errors } = state;

  // Sync user data vào form khi user load xong (chỉ 1 lần khi user.id thay đổi)
  useEffect(() => {
    if (!user) return;
    dispatch({ type: 'SET_FIELD', key: 'contactName', value: form.contactName || user.fullName || '' });
    dispatch({ type: 'SET_FIELD', key: 'contactEmail', value: form.contactEmail || user.email || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch phone từ API
  useEffect(() => {
    if (!user?.id) return;
    apiClient<{ success: boolean; data: { phone?: string } }>(`/users/${user.id}`)
      .then(res => {
        if (res.success && res.data?.phone) {
          dispatch({ type: 'SET_FIELD', key: 'contactPhone', value: form.contactPhone || res.data.phone || '' });
        }
      })
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch subjects
  useEffect(() => {
    apiClient<{ data: Subject[] }>('/subjects/tree')
      .then(res => setSubjects(res.data || []))
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false));
  }, []);

  // Fetch provinces
  useEffect(() => {
    setLoadingProvinces(true);
    fetch('/api/provinces')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProvinces(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => { })
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Tính selectedProvinceCode ở parent để fetch districts
  const selectedProvinceCode = useMemo(
    () => provinces.find(p => p.name === form.province)?.code.toString() || '',
    [provinces, form.province]
  );

  // Fetch districts khi province thay đổi
  useEffect(() => {
    if (!selectedProvinceCode) { setDistricts([]); return; }
    setLoadingDistricts(true);
    fetch(`/api/provinces?code=${selectedProvinceCode}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const list = data.districts || data.wards || [];
        setDistricts(Array.isArray(list) ? list : []);
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvinceCode]);

  // ── Stable callbacks ──────────────────────────────────────────────────────

  // FIX: updateForm stable reference, không phụ thuộc state
  const updateForm = useCallback((key: keyof FormData, value: string | number) => {
    dispatch({ type: 'SET_FIELD', key, value });
  }, []);

  const handleProvinceChange = useCallback((code: string) => {
    const name = provinces.find(p => p.code.toString() === code)?.name || '';
    dispatch({ type: 'SET_PROVINCE', name });
  }, [provinces]);

  const handleDistrictChange = useCallback((code: string) => {
    const name = districts.find(d => d.code.toString() === code)?.name || '';
    dispatch({ type: 'SET_FIELD', key: 'ward', value: name });
  }, [districts]);

  const toggleSubject = useCallback((sub: Pick<Subject, 'id' | 'name'>) => {
    setSelectedSubjects(prev => {
      const exists = prev.find(s => s.id === sub.id);
      if (exists) return prev.filter(s => s.id !== sub.id);
      return [...prev, { id: sub.id, name: sub.name, proposedPrice: '' }];
    });
  }, []);

  const setSubjectPrice = useCallback((id: number, price: string) => {
    setSelectedSubjects(prev =>
      prev.map(s => s.id === id ? { ...s, proposedPrice: price } : s)
    );
  }, []);

  // FIX: validate đọc trực tiếp từ form ref thay vì depend vào form object
  // → không cần useCallback với dependency, gọi validate() lúc submit là đủ
  const validate = (currentForm: FormData, currentSubjectsCount: number) => {
    const newErrors: Record<string, string> = {};
    if (!currentForm.contactName.trim()) newErrors.contactName = 'Vui lòng nhập họ tên';
    if (!currentForm.contactPhone.trim()) newErrors.contactPhone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9+\s\-()]{9,15}$/.test(currentForm.contactPhone.trim())) newErrors.contactPhone = 'Số điện thoại không hợp lệ';
    if (!currentForm.contactEmail.trim()) newErrors.contactEmail = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.contactEmail.trim())) newErrors.contactEmail = 'Email không hợp lệ';
    if (currentSubjectsCount === 0) newErrors.subjects = 'Vui lòng chọn ít nhất 1 môn học';
    if (!currentForm.gradeLevel) newErrors.gradeLevel = 'Vui lòng chọn cấp độ';
    if (!currentForm.teachingMode) newErrors.teachingMode = 'Vui lòng chọn hình thức học';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate(form, selectedSubjects.length);
    if (Object.keys(newErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: newErrors });
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      const addressDetail = [form.addressDetail, form.ward, form.province].filter(Boolean).join(', ');
      const requests = selectedSubjects.map(sub => ({
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        subjectId: sub.id,
        gradeLevel: form.gradeLevel,
        proposedPrice: sub.proposedPrice ? parseFloat(sub.proposedPrice) : undefined,
        teachingMode: form.teachingMode,
        sessionsPerWeek: form.sessionsPerWeek,
        durationMinutes: form.durationMinutes,
        addressDetail: addressDetail || undefined,
        studentNotes: form.studentNotes.trim() || undefined,
      }));

      await apiClient('/class-requests/bulk', {
        method: 'POST',
        body: JSON.stringify({ requests }),
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto'>
        <div className='relative mb-6'>
          <div className='h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in-75 duration-300'>
            <IconCheck size={48} className='text-primary' strokeWidth={2.5} />
          </div>
          <div className='absolute -top-1 -right-1 h-7 w-7 bg-green-500 rounded-full flex items-center justify-center'>
            <IconCheck size={14} className='text-white' />
          </div>
        </div>
        <h2 className='text-2xl font-extrabold text-foreground'>Đăng lớp thành công!</h2>
        <p className='mt-3 text-muted-foreground leading-relaxed max-w-sm'>
          Đã gửi <span className='font-bold text-primary'>{selectedSubjects.length} yêu cầu</span> cho môn{' '}
          <span className='font-semibold text-foreground'>{selectedSubjects.map(s => s.name).join(', ')}</span>.
          Gia sư sẽ liên hệ bạn trong vòng <span className='font-bold text-primary'>24 giờ</span>.
        </p>
        <div className='mt-6 flex flex-col sm:flex-row gap-3 w-full'>
          <Button
            className='flex-1 h-11'
            onClick={() => {
              setSubmitted(false);
              setSelectedSubjects([]);
              dispatch({
                type: 'RESET',
                initialForm: {
                  ...EMPTY_FORM,
                  contactName: user?.fullName ?? '',
                  contactEmail: user?.email ?? '',
                },
              });
            }}
          >
            Đăng lớp khác
          </Button>
          <Button variant='outline' className='flex-1 h-11' onClick={() => window.location.href = '/classes'}>
            Xem danh sách lớp
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className='space-y-6'>

      {/* STEP 1: Contact — isolated, typing chỉ re-render ContactSection */}
      <ContactSection
        form={{ contactName: form.contactName, contactPhone: form.contactPhone, contactEmail: form.contactEmail }}
        errors={errors}
        onChange={updateForm}
      />

      {/* STEP 2: Subjects — isolated, toggle/price chỉ re-render SubjectsSection */}
      <SubjectsSection
        subjects={subjects}
        subjectsLoading={subjectsLoading}
        selectedSubjects={selectedSubjects}
        errors={errors}
        onToggle={toggleSubject}
        onPriceChange={setSubjectPrice}
      />

      {/* STEP 3: Class Details — isolated, chip click chỉ re-render ClassDetailsSection */}
      <ClassDetailsSection
        gradeLevel={form.gradeLevel}
        teachingMode={form.teachingMode}
        sessionsPerWeek={form.sessionsPerWeek}
        durationMinutes={form.durationMinutes}
        errors={errors}
        onChange={updateForm}
      />

      {/* STEP 4: Location — isolated */}
      <LocationSection
        province={form.province}
        ward={form.ward}
        addressDetail={form.addressDetail}
        teachingMode={form.teachingMode}
        provinces={provinces}
        districts={districts}
        loadingProvinces={loadingProvinces}
        loadingDistricts={loadingDistricts}
        onProvinceChange={handleProvinceChange}
        onDistrictChange={handleDistrictChange}
        onChange={updateForm}
      />

      {/* STEP 5: Notes — isolated, typing chỉ re-render NotesSection */}
      <NotesSection value={form.studentNotes} onChange={updateForm} />

      {/* Summary & Submit */}
      <div className='rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 p-6'>
        <Button
          type='submit'
          className='w-full h-12 text-base font-bold gap-2 shadow-md hover:shadow-lg transition-all'
          disabled={loading}
        >
          {loading ? (
            <>
              <IconLoader2 size={18} className='animate-spin' />
              Đang gửi {selectedSubjects.length} yêu cầu...
            </>
          ) : (
            <>
              <IconSend size={18} />
              Đăng {selectedSubjects.length > 1 ? `${selectedSubjects.length} lớp` : 'lớp'} ngay
            </>
          )}
        </Button>
        <p className='mt-3 text-center text-xs text-muted-foreground'>
          Hoàn toàn miễn phí · Nhận phản hồi trong 24 giờ · Không cần đăng nhập
        </p>
      </div>
    </form>
  );
}