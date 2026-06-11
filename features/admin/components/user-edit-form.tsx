'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import {
  userInfoSchema,
  avatarSchema,
  resetPasswordSchema,
  type UserInfoValues,
  type AvatarValues,
  type ResetPasswordValues,
  PASSWORD_PATTERN,
  PASSWORD_MESSAGE,
  GENDER_OPTIONS
} from '../schemas/user';
import { updateUserMutation, updateAvatarMutation, resetPasswordMutation } from '../api/mutations';
import { userKeys, userStatusesQueryOptions } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { User } from '../api/types';
import { getAvatarUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { AddressSelector } from '@/components/ui/address-selector';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADMIN_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' }
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Tạm ngưng' },
  { value: 'SUSPENDED', label: 'Bị khóa' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ xác minh' }
];

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
  // Chuyển Record<string,string> thành mảng [{key, url}] để render
  const entries = Object.entries(value || {});

  const addRow = () => {
    // Tìm platform chưa được dùng
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
              {/* Platform picker */}
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
                  {/* Giữ option hiện tại nếu không có trong danh sách */}
                  {!availablePlatforms.find((p) => p.key === key) && (
                    <SelectItem value={key}>
                      {platform.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Icon platform */}
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40'>
                {IconComp && <IconComp size={16} className='text-muted-foreground' />}
              </div>

              {/* URL input */}
              <Input
                type='url'
                value={url}
                onChange={(e) => changeUrl(key, e.target.value)}
                placeholder={platform.placeholder}
                disabled={disabled}
                className='h-9 flex-1 text-xs'
              />

              {/* Nút xóa */}
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Tab 1: User Info ─────────────────────────────────────────────────────────
function UserInfoTab({ user }: { user: User }) {
  const router = useRouter();

  const { data: statusesData } = useQuery(userStatusesQueryOptions());

  const statusOptions = useMemo(() => {
    if (!statusesData) {
      return [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Tạm ngưng' },
        { value: 'SUSPENDED', label: 'Bị khóa' },
        { value: 'PENDING_VERIFICATION', label: 'Chờ xác minh' }
      ];
    }
    return statusesData;
  }, [statusesData]);

  const mutation = useMutation({
    ...updateUserMutation,
    onSuccess: (data) => {
      toast.success(data?.message || 'Cập nhật thông tin thành công');
      getQueryClient().invalidateQueries({ queryKey: userKeys.all });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Cập nhật thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      first_name: user.first_name,
      email: user.email,
      phone: user.phone ?? '',
      province: user.province ?? '',
      ward: user.ward ?? '',
      address: user.address ?? '',
      socialLinks: user.socialLinks ?? {},
      role: user.role ?? 'admin',
      status: user.status ? user.status.toUpperCase() : 'ACTIVE',
      gender: (user.gender ?? 'OTHER') as 'MALE' | 'FEMALE' | 'OTHER'
    } as UserInfoValues,
    validators: { onSubmit: userInfoSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        id: user.id,
        values: {
          first_name: value.first_name,
          email: value.email,
          phone: value.phone ?? '',
          province: value.province,
          ward: value.ward,
          address: value.address,
          socialLinks: value.socialLinks || {},
          role: value.role,
          status: value.status,
          avatar_url: user.avatar_url,
          gender: value.gender
        }
      });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UserInfoValues>();

  // Handler để cập nhật province và ward từ AddressSelector vào form state
  const handleAddressChange = useCallback(
    ({ province, ward }: { province: string; ward: string }) => {
      form.setFieldValue('province', province);
      form.setFieldValue('ward', ward);
    },
    [form]
  );

  return (
    <form.AppForm>
      <form.Form id='user-info-form' className='space-y-4 p-0'>

        {/* Row 1: Họ tên (full width) */}
        <FormTextField
          name='first_name'
          label='Họ và tên'
          placeholder='Nhập họ và tên...'
          required
          validators={{
            onBlur: z.string().min(2, 'Họ tên phải từ 2 đến 200 ký tự')
          }}
        />

        {/* Row 2: Email (readonly) + Số điện thoại */}
        <div className='grid gap-4 md:grid-cols-2'>
          <FormTextField
            name='email'
            label='Email'
            disabled
            className='bg-muted/40 text-muted-foreground'
          />
          <FormTextField
            name='phone'
            label='Số điện thoại'
            placeholder='+84 912 345 678'
            validators={{
              onBlur: z.string().max(20, 'Số điện thoại không được vượt quá 20 ký tự').optional().or(z.literal(''))
            }}
          />
        </div>

        {/* Row 3: Địa chỉ (Tỉnh/Thành + Phường/Xã) — dùng AddressSelector */}
        <div>
          <form.Subscribe selector={(s) => ({ province: s.values.province, ward: s.values.ward })}>
            {({ province, ward }) => (
              <AddressSelector
                value={{ province, ward }}
                onChange={handleAddressChange}
                disabled={mutation.isPending}
              />
            )}
          </form.Subscribe>
          {/* Lỗi validate địa chỉ */}
          <form.Subscribe selector={(s) => ({
            provinceError: s.fieldMeta.province?.errors?.[0],
            wardError: s.fieldMeta.ward?.errors?.[0]
          })}>
            {({ provinceError, wardError }) => (
              <div className='grid grid-cols-2 gap-4 mt-0.5'>
                <div>
                  {provinceError && (
                    <p className='text-destructive text-xs mt-1'>{String(provinceError)}</p>
                  )}
                </div>
                <div>
                  {wardError && (
                    <p className='text-destructive text-xs mt-1'>{String(wardError)}</p>
                  )}
                </div>
              </div>
            )}
          </form.Subscribe>
        </div>

        {/* Row 4: Địa chỉ cụ thể (full width) */}
        <FormTextField
          name='address'
          label='Địa chỉ cụ thể'
          placeholder='Ví dụ: 123 Phố Huế, Hai Bà Trưng'
          required
          validators={{
            onBlur: z.string().min(1, 'Địa chỉ không được để trống')
          }}
        />

        {/* Row 5: Social Links */}
        <form.Subscribe selector={(s) => s.values.socialLinks}>
          {(socialLinks) => (
            <SocialLinksEditor
              value={socialLinks || {}}
              onChange={(val) => form.setFieldValue('socialLinks', val)}
              disabled={mutation.isPending}
            />
          )}
        </form.Subscribe>

        {/* Row 6: Giới tính + Vai trò */}
        <div className='grid gap-4 md:grid-cols-2'>
          <FormSelectField
            name='gender'
            label='Giới tính'
            required
            options={GENDER_OPTIONS}
            placeholder='Chọn giới tính'
          />
          <FormSelectField
            name='role'
            label='Vai trò'
            required
            options={ADMIN_ROLE_OPTIONS}
            placeholder='Chọn vai trò'
          />
        </div>

        {/* Row 7: Trạng thái (full width để cân đối) */}
        <FormSelectField
          name='status'
          label='Trạng thái'
          required
          options={statusOptions}
          placeholder='Chọn trạng thái'
        />

        <div className='flex justify-end pt-2'>
          <Button type='submit' form='user-info-form' disabled={mutation.isPending} isLoading={mutation.isPending}>
            <Icons.circleCheck className='h-4 w-4' />
            Lưu thông tin
          </Button>
        </div>
      </form.Form>
    </form.AppForm>
  );
}

function AvatarPreviewHelper({
  val,
  localFile,
  setPreview,
  userAvatarUrl
}: {
  val?: string;
  localFile: any;
  setPreview: (val: string) => void;
  userAvatarUrl: string;
}) {
  useEffect(() => {
    if (!localFile) {
      setPreview(val || userAvatarUrl);
    }
  }, [val, localFile, setPreview, userAvatarUrl]);
  return null;
}

// ─── Tab 2: Avatar ────────────────────────────────────────────────────────────
function AvatarTab({ user, onAvatarSuccess }: { user: User; onAvatarSuccess?: () => void }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string>(getAvatarUrl(user.avatar_url) || '');
  const [isDragging, setIsDragging] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...updateAvatarMutation,
    onSuccess: (data) => {
      toast.success(data?.message || 'Cập nhật ảnh đại diện thành công');
      getQueryClient().invalidateQueries({ queryKey: userKeys.all });
      onAvatarSuccess?.();
      clearLocalFile();
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Cập nhật ảnh đại diện thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      avatar_url: ''
    } as AvatarValues,
    validators: { onSubmit: avatarSchema },
    onSubmit: async ({ value }) => {
      if (localFile) {
        await mutation.mutateAsync({ id: user.id, file: localFile });
      } else {
        await mutation.mutateAsync({ id: user.id, avatarUrl: value.avatar_url || '' });
      }
    }
  });

  const { FormTextField } = useFormFields<AvatarValues>();

  // Handle local file selection → generate base64 preview, store URL in form field
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp, svg)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5 MB');
      return;
    }
    setLocalFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      // NOTE: backend only accepts a URL string — data URL is preview-only
      // Keep the URL field intact so user can still save a hosted URL
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function clearLocalFile() {
    setLocalFile(null);
    setPreview(user.avatar_url ? `${getAvatarUrl(user.avatar_url)}?t=${Date.now()}` : '');
  }

  return (
    <form.AppForm>
      <form.Form id='avatar-form' className='space-y-6 p-0'>
        {/* Big avatar preview */}
        <div className='flex flex-col items-center gap-3'>
          <div className='relative'>
            <Avatar className='h-28 w-28 ring-2 ring-border ring-offset-2 ring-offset-background shadow-md'>
              <AvatarImage src={preview || undefined} alt={user.first_name} />
              <AvatarFallback className='text-2xl font-semibold'>{getInitials(user.first_name)}</AvatarFallback>
            </Avatar>
            {preview && (
              <button
                type='button'
                onClick={clearLocalFile}
                className='absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow hover:bg-destructive/90 transition-colors'
                title='Xoá ảnh preview'
              >
                <Icons.close size={12} />
              </button>
            )}
          </div>
          <p className='text-xs text-muted-foreground'>Xem trước ảnh đại diện</p>
        </div>

        {/* Drop zone / file picker */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('avatar-file-input')?.click()}
          className={[
            'group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/60 hover:bg-muted/50'
          ].join(' ')}
        >
          <input
            id='avatar-file-input'
            type='file'
            accept='image/jpeg,image/png,image/gif,image/webp,image/svg+xml'
            className='hidden'
            onChange={handleInputChange}
          />
          <Icons.camera className='h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors' />
          <div className='text-center'>
            <p className='text-sm font-medium'>
              {localFile ? localFile.name : 'Kéo thả hoặc bấm để chọn ảnh từ máy'}
            </p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              {localFile
                ? `${(localFile.size / 1024).toFixed(1)} KB — ${localFile.type}`
                : 'JPG, PNG, GIF, WEBP, SVG · Tối đa 5 MB'}
            </p>
          </div>
          {localFile && (
            <span className='text-xs text-primary font-medium'>✓ Đã chọn (chỉ xem trước)</span>
          )}
        </div>

        {/* Info banner for local file */}
        {localFile && (
          <div className='rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'>
            <span className='font-medium'>Lưu ý: </span>
            Backend chỉ lưu <strong>URL</strong> ảnh. Để lưu ảnh trên, hãy upload file lên dịch vụ lưu trữ (Cloudinary, S3, ImgBB…) rồi dán URL vào ô bên dưới.
          </div>
        )}

        {/* Divider */}
        <div className='flex items-center gap-3'>
          <div className='h-px flex-1 bg-border' />
          <span className='text-xs text-muted-foreground'>hoặc nhập URL trực tiếp</span>
          <div className='h-px flex-1 bg-border' />
        </div>

        {/* URL input */}
        <FormTextField
          name='avatar_url'
          label='URL ảnh đại diện'
          placeholder='https://example.com/avatar.jpg'
          type='url'
          validators={{
            onChange: z.string().optional().or(z.literal(''))
          }}
        />

        {/* Live preview sync from URL field */}
        <form.Subscribe selector={(s) => s.values.avatar_url}>
          {(val) => (
            <AvatarPreviewHelper
              val={val}
              localFile={localFile}
              setPreview={setPreview}
              userAvatarUrl={user.avatar_url || ''}
            />
          )}
        </form.Subscribe>

        <div className='flex justify-end pt-2'>
          <Button
            type='submit'
            form='avatar-form'
            disabled={mutation.isPending}
            isLoading={mutation.isPending}
          >
            <Icons.circleCheck className='h-4 w-4' />
            Lưu ảnh
          </Button>
        </div>
      </form.Form>
    </form.AppForm>
  );
}


// ─── Tab 3: Đổi mật khẩu ─────────────────────────────────────────────────────
function ChangePasswordTab({ user }: { user: User }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    ...resetPasswordMutation,
    onSuccess: (data) => {
      toast.success(data?.message || 'Đổi mật khẩu thành công');
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Đổi mật khẩu thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      password: '',
      newPassword: '',
      confirmPassword: ''
    } as ResetPasswordValues,
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      if (!PASSWORD_PATTERN.test(value.newPassword)) {
        toast.error(PASSWORD_MESSAGE);
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        toast.error('Xác nhận mật khẩu mới không khớp');
        return;
      }
      await mutation.mutateAsync({
        id: user.id,
        data: {
          password: value.password,
          newPassword: value.newPassword,
          confirmPassword: value.confirmPassword
        }
      });
    }
  });

  const { FormTextField } = useFormFields<ResetPasswordValues>();

  return (
    <form.AppForm>
      <form.Form id='change-password-form' className='space-y-5 p-0'>
        <div className='rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'>
          <span className='font-medium'>Chính sách mật khẩu: </span>Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt, không chứa khoảng trắng.
        </div>

        <FormTextField
          name='password'
          label='Mật khẩu hiện tại'
          placeholder='Nhập mật khẩu hiện tại...'
          type={showCurrent ? 'text' : 'password'}
          required
          rightAdornment={
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
            >
              {showCurrent ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
            </button>
          }
        />

        <FormTextField
          name='newPassword'
          label='Mật khẩu mới'
          placeholder='Nhập mật khẩu mới...'
          type={showNew ? 'text' : 'password'}
          required
          rightAdornment={
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
            >
              {showNew ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
            </button>
          }
        />

        <FormTextField
          name='confirmPassword'
          label='Xác nhận mật khẩu mới'
          placeholder='Nhập lại mật khẩu mới...'
          type={showConfirm ? 'text' : 'password'}
          required
          rightAdornment={
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
            </button>
          }
        />

        <div className='flex justify-end pt-2'>
          <Button type='submit' form='change-password-form' disabled={mutation.isPending} isLoading={mutation.isPending}>
            <Icons.lock className='h-4 w-4' />
            Đổi mật khẩu
          </Button>
        </div>
      </form.Form>
    </form.AppForm>
  );
}

// ─── Main Edit Form ───────────────────────────────────────────────────────────
export default function UserEditForm({ user }: { user: User }) {
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const handleAvatarSuccess = () => {
    setAvatarTimestamp(Date.now());
  };

  const statusLabel: Record<string, string> = {
    Active: 'Hoạt động',
    Inactive: 'Tạm ngưng',
    Suspended: 'Bị khóa',
    Pending_verification: 'Chờ xác minh'
  };

  const displayAvatarUrl = user.avatar_url ? `${getAvatarUrl(user.avatar_url)}?t=${avatarTimestamp}` : undefined;

  return (
    <div className='mx-auto w-full max-w-2xl space-y-6'>
      {/* User header */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16 ring-2 ring-border ring-offset-2 ring-offset-background'>
              <AvatarImage src={displayAvatarUrl} alt={user.first_name} />
              <AvatarFallback className='text-lg font-semibold'>{getInitials(user.first_name)}</AvatarFallback>
            </Avatar>
            <div className='flex-1 space-y-1'>
              <h2 className='text-lg font-semibold'>{user.first_name}</h2>
              <p className='text-sm text-muted-foreground'>{user.email}</p>
              <div className='flex gap-2'>
                <Badge variant='outline' className='capitalize text-xs'>
                  {user.role.replace('_', ' ')}
                </Badge>
                <Badge
                  variant={user.status === 'Active' ? 'default' : 'secondary'}
                  className='text-xs'
                >
                  {statusLabel[user.status] ?? user.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue='info'>
        <TabsList className='w-full'>
          <TabsTrigger value='info' className='flex-1 gap-1.5'>
            <Icons.user className='h-4 w-4' />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value='avatar' className='flex-1 gap-1.5'>
            <Icons.media className='h-4 w-4' />
            Avatar
          </TabsTrigger>
          <TabsTrigger value='password' className='flex-1 gap-1.5'>
            <Icons.lock className='h-4 w-4' />
            Mật khẩu
          </TabsTrigger>
        </TabsList>

        <TabsContent value='info'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin người dùng</CardTitle>
              <CardDescription>Cập nhật họ tên, số điện thoại, vai trò và trạng thái.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              <UserInfoTab user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='avatar'>
          <Card>
            <CardHeader>
              <CardTitle>Ảnh đại diện</CardTitle>
              <CardDescription>Cập nhật URL ảnh đại diện cho tài khoản.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              <AvatarTab user={user} onAvatarSuccess={handleAvatarSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='password'>
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              <ChangePasswordTab user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
