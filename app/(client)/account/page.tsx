'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { Icons } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

type GenderType = 'MALE' | 'FEMALE' | 'OTHER';

const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

interface Province {
  name: string;
  code: number;
}

interface Ward {
  name: string;
  code: number;
}

// Component Combobox Searchable Select đồng bộ cho địa chỉ
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Chọn...',
  emptyMessage = 'Không tìm thấy kết quả.',
  disabled = false
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full h-10 justify-between font-normal bg-background border-input text-left'
          disabled={disabled}
        >
          <span className='line-clamp-1'>{selected?.label ?? placeholder}</span>
          <Icons.chevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Tìm kiếm...' className='h-9' />
          <CommandList className='max-h-[220px] overflow-y-auto'>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label} // Dùng label để gõ tìm kiếm tiếng Việt chính xác
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className='text-xs cursor-pointer'
                >
                  <Icons.check
                    className={cn(
                      'mr-2 h-3.5 w-3.5 text-primary',
                      value === opt.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Social platforms config ───────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: 'https://facebook.com/username' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/username' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', placeholder: 'https://linkedin.com/in/username' },
  { key: 'twitter', label: 'Twitter/X', icon: 'twitter', placeholder: 'https://x.com/username' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok', placeholder: 'https://tiktok.com/@username' },
  { key: 'github', label: 'GitHub', icon: 'github', placeholder: 'https://github.com/username' },
  { key: 'other', label: 'Khác', icon: 'link', placeholder: 'https://example.com' },
] as const;

// ─── SocialLinksEditor ────────────────────────────────────────────────────────
interface SocialLinksEditorProps {
  value: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
  disabled?: boolean;
}

function SocialLinksEditor({ value, onChange, disabled = false }: SocialLinksEditorProps) {
  const entries = Object.entries(value || {});

  const addRow = () => {
    const usedKeys = Object.keys(value || {});
    const firstFree = SOCIAL_PLATFORMS.find((p) => !usedKeys.includes(p.key));
    const newKey = firstFree?.key ?? `other_${Date.now()}`;
    onChange({ ...value, [newKey]: '' });
  };

  const removeRow = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const changePlatform = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(value || {})) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  const changeUrl = (key: string, url: string) => {
    onChange({ ...value, [key]: url });
  };

  const getPlatform = (key: string) =>
    SOCIAL_PLATFORMS.find((p) => p.key === key) ??
    { key: 'other', label: 'Khác', icon: 'link', placeholder: 'https://...' };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium leading-none'>
          Liên kết mạng xã hội
        </label>
        <button
          type='button'
          onClick={addRow}
          disabled={disabled || entries.length >= SOCIAL_PLATFORMS.length}
          className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        >
          <Icons.add size={14} />
          Thêm mạng xã hội
        </button>
      </div>

      {entries.length === 0 && (
        <div className='rounded-md border border-dashed border-border px-4 py-3 text-xs text-muted-foreground text-center'>
          Chưa có liên kết nào. Nhấn “Thêm mạng xã hội” để bắt đầu.
        </div>
      )}

      <div className='space-y-2'>
        {entries.map(([key, url]) => {
          const platform = getPlatform(key);
          const IconComp = Icons[platform.icon as keyof typeof Icons] as React.ComponentType<{ size?: number; className?: string }>;
          const usedKeys = Object.keys(value || {}).filter((k) => k !== key);
          const availablePlatforms = SOCIAL_PLATFORMS.filter((p) => !usedKeys.includes(p.key));

          return (
            <div key={key} className='flex items-center gap-2'>
              <Select
                value={key}
                onValueChange={(val) => changePlatform(key, val)}
                disabled={disabled}
              >
                <SelectTrigger className='h-9 w-36 text-xs shrink-0'>
                  <SelectValue placeholder='Chọn MXH' />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatforms.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.label}
                    </SelectItem>
                  ))}
                  {!availablePlatforms.find((p) => p.key === key) && (
                    <SelectItem value={key}>
                      {platform.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40'>
                {IconComp && <IconComp size={16} className='text-muted-foreground' />}
              </div>

              <Input
                type='url'
                value={url}
                onChange={(e) => changeUrl(key, e.target.value)}
                placeholder={platform.placeholder}
                disabled={disabled}
                className='h-9 flex-1 text-xs'
              />

              <button
                type='button'
                onClick={() => removeRow(key)}
                disabled={disabled}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40'
                title='Xóa liên kết'
              >
                <Icons.trash size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthSession();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form state
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    provinceCode: '',
    provinceName: '',
    wardCode: '',
    wardName: '',
    detailedAddress: '',
    socialLinks: {} as Record<string, string>,
    gender: 'OTHER' as GenderType,
    birthYear: '',
  });
  const [birthYearError, setBirthYearError] = useState<string>('');

  // API state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Fetch profile details from backend
  useEffect(() => {
    if (!user || !user.id) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        let data: any = null;
        // Thử gọi API lấy thông tin chi tiết user
        try {
          const res = await apiClient<{ success: boolean; data: any }>(`/users/${user.id}`);
          if (res.success && res.data) {
            data = res.data;
          }
        } catch (e) {
          console.log('GET /users/{id} failed, trying /users/{id}/profile...', e);
          try {
            const res = await apiClient<{ success: boolean; data: any }>(`/users/${user.id}/profile`);
            if (res.success && res.data) {
              data = res.data;
            }
          } catch (e2) {
            console.error('Both profile endpoints failed', e2);
          }
        }

        if (data) {
          setProfile({
            name: data.fullName || user.fullName || '',
            phone: data.phone || '',
            provinceCode: '',
            provinceName: data.province || '',
            wardCode: '',
            wardName: data.ward || '',
            detailedAddress: data.address || '',
            socialLinks: data.socialLinks || {},
            gender: (data.gender as GenderType) || 'OTHER',
            birthYear: data.birthYear ? String(data.birthYear) : '',
          });
        } else {
          setProfile(prev => ({
            ...prev,
            name: user.fullName || '',
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin profile từ API:', err);
        setProfile(prev => ({
          ...prev,
          name: user.fullName || '',
        }));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch('/api/provinces');
        if (res.ok) {
          const data: Province[] = await res.json();
          const validData = Array.isArray(data) ? data : [];
          setProvinces(validData);
        }
      } catch (err) {
        console.error('Error fetching provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Tự động tìm provinceCode khi provinces hoặc provinceName thay đổi
  useEffect(() => {
    if (provinces.length === 0 || !profile.provinceName || profile.provinceCode) return;

    const matched = provinces.find(p =>
      p.name.toLowerCase().includes(profile.provinceName.toLowerCase()) ||
      profile.provinceName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (matched) {
      setProfile(prev => ({
        ...prev,
        provinceCode: matched.code.toString(),
        provinceName: matched.name
      }));
    }
  }, [provinces, profile.provinceName, profile.provinceCode]);

  // Fetch wards when province code changes
  useEffect(() => {
    if (!profile.provinceCode) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(`/api/provinces?code=${profile.provinceCode}`);
        if (res.ok) {
          const data = await res.json();
          const rawWards = data.districts || data.wards || [];
          const wardList: Ward[] = Array.isArray(rawWards) ? rawWards : [];
          setWards(wardList);
        }
      } catch (err) {
        console.error('Error fetching wards:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [profile.provinceCode]);

  // Tự động tìm wardCode khi wards hoặc wardName thay đổi
  useEffect(() => {
    if (wards.length === 0 || !profile.wardName || profile.wardCode) return;

    const matched = wards.find(w =>
      w.name.toLowerCase().includes(profile.wardName.toLowerCase()) ||
      profile.wardName.toLowerCase().includes(w.name.toLowerCase())
    );
    if (matched) {
      setProfile(prev => ({
        ...prev,
        wardCode: matched.code.toString(),
        wardName: matched.name
      }));
    }
  }, [wards, profile.wardName, profile.wardCode]);

  const handleProvinceCodeChange = (code: string) => {
    const name = provinces.find(p => p.code.toString() === code)?.name || '';
    setProfile(prev => ({
      ...prev,
      provinceCode: code,
      provinceName: name,
      wardCode: '',
      wardName: '', // reset ward when province changes
    }));
  };

  const handleWardCodeChange = (code: string) => {
    const name = wards.find(w => w.code.toString() === code)?.name || '';
    setProfile(prev => ({
      ...prev,
      wardCode: code,
      wardName: name,
    }));
  };

  const handleSave = async () => {
    if (!user || !user.id) return;

    // Validate name (min 2, max 200)
    if (!profile.name || profile.name.trim().length < 2 || profile.name.trim().length > 200) {
      toast.error('Họ tên phải từ 2 đến 200 ký tự');
      return;
    }

    // Validate province/ward/address
    if (!profile.provinceName) {
      toast.error('Tỉnh/Thành phố không được để trống');
      return;
    }
    if (!profile.wardName) {
      toast.error('Xã/Phường không được để trống');
      return;
    }
    if (!profile.detailedAddress) {
      toast.error('Địa chỉ chi tiết không được để trống');
      return;
    }

    // Validate phone if not empty
    if (profile.phone && profile.phone.trim().length > 0) {
      const phoneRegex = /^[0-9+\-\s]{7,20}$/;
      if (!phoneRegex.test(profile.phone.trim())) {
        toast.error('Số điện thoại không hợp lệ (7–20 ký tự)');
        return;
      }
    }

    // Validate birthYear if not empty
    let birthYearInt: number | null = null;
    if (profile.birthYear.trim() !== '') {
      const byVal = parseInt(profile.birthYear.trim(), 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(byVal) || profile.birthYear.trim().length !== 4 || byVal < 1900 || byVal > currentYear) {
        setBirthYearError(`Năm sinh phải là số từ 1900 đến ${currentYear}`);
        toast.error(`Năm sinh không hợp lệ (1900–${currentYear})`);
        return;
      }
      birthYearInt = byVal;
    }
    setBirthYearError('');

    setSaving(true);
    try {
      // Chuẩn bị request body theo UpdateProfileRequest
      const requestBody: Record<string, any> = {
        fullName: profile.name.trim(),
        phone: profile.phone ? profile.phone.trim() : '',
        province: profile.provinceName,
        ward: profile.wardName,
        address: profile.detailedAddress.trim(),
        socialLinks: profile.socialLinks || {},
        gender: profile.gender,
        birthYear: birthYearInt,
      };

      const res = await apiClient<{ success: boolean; message?: string }>(`/users/${user.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      if (res.success) {
        toast.success(res.message || 'Cập nhật thông tin thành công');
        setEditMode(false);
      } else {
        toast.error(res.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật profile:', err);
      toast.error(err?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className='flex items-center justify-center py-10'>
        <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2 text-sm text-muted-foreground'>Đang tải hồ sơ...</span>
      </div>
    );
  }

  const roleText = user?.roles.includes('tutor')
    ? 'Gia sư'
    : user?.roles.includes('parent')
      ? 'Phụ huynh'
      : 'Học sinh';

  return (
    <div className='space-y-6'>
      <ScrollReveal variant='fade-up' duration={650} threshold={0.05}>
        <div className='rounded-2xl border bg-card shadow-sm p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-lg font-bold'>Thông tin cá nhân</h2>
              <p className='text-sm text-muted-foreground'>Cập nhật hồ sơ của bạn</p>
            </div>
            <Button
              variant={editMode ? 'default' : 'outline'}
              size='sm'
              className='gap-1.5'
              disabled={saving}
              onClick={editMode ? handleSave : () => setEditMode(true)}
            >
              {saving ? (
                <><Icons.spinner size={14} className='animate-spin' />Đang lưu...</>
              ) : editMode ? (
                <><Icons.check size={14} />Lưu</>
              ) : (
                <><Icons.edit size={14} />Chỉnh sửa</>
              )}
            </Button>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            {/* Họ và tên */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.user size={14} /> Họ và tên
              </Label>
              <Input
                value={profile.name}
                disabled={!editMode}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className='h-10'
              />
            </div>

            {/* Email (Disabled) */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.email size={14} /> Email
              </Label>
              <Input
                value={user?.email || ''}
                disabled={true}
                className='h-10'
              />
            </div>

            {/* Số điện thoại */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.phone size={14} /> Số điện thoại
              </Label>
              <Input
                value={profile.phone}
                disabled={!editMode}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                className='h-10'
              />
            </div>

            {/* Vai trò (Disabled) */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.school size={14} /> Vai trò
              </Label>
              <Input
                value={roleText}
                disabled={true}
                className='h-10'
              />
            </div>

            {/* Giới tính */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.user size={14} /> Giới tính
              </Label>
              {editMode ? (
                <Select
                  value={profile.gender}
                  onValueChange={(val) => setProfile({ ...profile, gender: val as GenderType })}
                >
                  <SelectTrigger className='h-10 w-full'>
                    <SelectValue placeholder='Chọn giới tính' />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={GENDER_OPTIONS.find(g => g.value === profile.gender)?.label ?? 'Khác'}
                  disabled={true}
                  className='h-10'
                />
              )}
            </div>

            {/* Năm sinh */}
            <div className='space-y-1.5'>
              <Label htmlFor='birthYear' className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.calendar size={14} /> Năm sinh
              </Label>
              <Input
                id='birthYear'
                placeholder='Ví dụ: 2000'
                value={profile.birthYear}
                disabled={!editMode}
                maxLength={4}
                inputMode='numeric'
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setProfile({ ...profile, birthYear: val });
                  if (val && val.length === 4) {
                    const byVal = parseInt(val, 10);
                    const currentYear = new Date().getFullYear();
                    if (byVal < 1900 || byVal > currentYear) {
                      setBirthYearError(`Năm sinh phải từ 1900 đến ${currentYear}`);
                    } else {
                      setBirthYearError('');
                    }
                  } else {
                    setBirthYearError('');
                  }
                }}
                className={`h-10 ${birthYearError && editMode ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {editMode && birthYearError && (
                <p className='text-xs text-destructive mt-1'>{birthYearError}</p>
              )}
            </div>

            {/* Tỉnh / Thành phố (Dropdown 1 - Combobox) */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.mapPin size={14} /> Tỉnh/Thành phố
              </Label>
              {editMode ? (
                <SearchableSelect
                  value={profile.provinceCode}
                  onValueChange={handleProvinceCodeChange}
                  options={provinces.map(p => ({ value: p.code.toString(), label: p.name }))}
                  placeholder='Chọn Tỉnh/Thành phố'
                  disabled={loadingProvinces}
                />
              ) : (
                <Input
                  value={profile.provinceName}
                  disabled={true}
                  className='h-10'
                />
              )}
            </div>

            {/* Phường / Xã (Dropdown 2 - Combobox) */}
            <div className='space-y-1.5'>
              <Label className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <Icons.mapPin size={14} /> Phường/Xã
                </span>
                {loadingWards && (
                  <span className='flex items-center gap-1 text-[10px] text-primary animate-pulse'>
                    <Icons.spinner size={10} className='animate-spin' />
                    Đang tải...
                  </span>
                )}
              </Label>
              {editMode ? (
                <SearchableSelect
                  value={profile.wardCode}
                  onValueChange={handleWardCodeChange}
                  options={wards.map(w => ({ value: w.code.toString(), label: w.name }))}
                  placeholder='Chọn Phường/Xã'
                  disabled={loadingWards || !profile.provinceCode}
                />
              ) : (
                <Input
                  value={profile.wardName}
                  disabled={true}
                  className='h-10'
                />
              )}
            </div>

            {/* 1. Địa chỉ chi tiết */}
            <div className='space-y-1.5 sm:col-span-2'>
              <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icons.home size={14} /> Địa chỉ chi tiết (Số nhà, tên đường...)
              </Label>
              <Input
                value={profile.detailedAddress}
                disabled={!editMode}
                onChange={e => setProfile({ ...profile, detailedAddress: e.target.value })}
                className='h-10'
                placeholder='Ví dụ: Số 12, Ngõ 34, Đường Trần Hưng Đạo'
              />
            </div>


            {/* 3. Liên kết mạng xã hội */}
            <div className='space-y-1.5 sm:col-span-2'>
              <SocialLinksEditor
                value={profile.socialLinks || {}}
                onChange={(val) => setProfile({ ...profile, socialLinks: val })}
                disabled={!editMode || saving}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}