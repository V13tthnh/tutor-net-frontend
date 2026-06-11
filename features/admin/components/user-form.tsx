'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { userSchema, type UserFormValues, GENDER_OPTIONS } from '../schemas/user';
import { createUserMutation } from '../api/mutations';
import { userKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { User } from '../api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as z from 'zod';
import { useState } from 'react';
import { Icons } from '@/components/icons';

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

export default function UserForm({ initialData, pageTitle }: { initialData: User | null; pageTitle: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: (data) => {
      toast.success(data?.message || 'Tạo tài khoản quản trị viên thành công');
      getQueryClient().invalidateQueries({ queryKey: userKeys.all });
      router.push('/admin/users');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Không thể tạo tài khoản');
    }
  });

  const isPending = createMutation.isPending;

  const form = useAppForm({
    defaultValues: {
      first_name: initialData?.first_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || 'admin',
      status: initialData?.status ? initialData.status.toUpperCase() : 'ACTIVE',
      gender: (initialData?.gender ?? 'OTHER') as 'MALE' | 'FEMALE' | 'OTHER',
      password: '',
      confirm_password: ''
    } as UserFormValues,
    validators: {
      onSubmit: userSchema
    },
    onSubmit: async ({ value }) => {
      // Schema đã validate tất cả - chỉ cần gửi request
      await createMutation.mutateAsync(value);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UserFormValues>();

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>
          Tạo tài khoản quản trị viên mới và gán vai trò RBAC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form id='user-form' className='space-y-6'>
            <div className='space-y-4'>
              {/* Row 1: Họ tên (full width) */}
              <FormTextField
                name='first_name'
                label='Họ và tên'
                placeholder='Nhập họ và tên...'
                required
                validators={{
                  onBlur: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự')
                }}
              />

              {/* Row 2: Email + Số điện thoại */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormTextField
                  name='email'
                  label='Email'
                  placeholder='admin@example.com'
                  required
                  type='email'
                  validators={{
                    onBlur: z.string().email('Email không đúng định dạng')
                  }}
                />
                <FormTextField
                  name='phone'
                  label='Số điện thoại'
                  placeholder='Nhập số điện thoại...'
                  validators={{
                    onBlur: z.string().max(20, 'Số điện thoại không được vượt quá 20 ký tự').optional().or(z.literal(''))
                  }}
                />
              </div>

              {/* Row 3: Giới tính + Vai trò */}
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
                  validators={{
                    onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
                  }}
                />
              </div>

              {/* Row 4: Trạng thái (full width để cân đối) */}
              <FormSelectField
                name='status'
                label='Trạng thái'
                required
                options={STATUS_OPTIONS}
                placeholder='Chọn trạng thái'
                validators={{
                  onBlur: z.string().min(1, 'Vui lòng chọn trạng thái')
                }}
              />

              {/* Divider */}
              <div className='relative my-1'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-border' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-card px-2 text-muted-foreground'>Mật khẩu</span>
                </div>
              </div>

              {/* Row 5: Mật khẩu + Xác nhận mật khẩu */}
              <div className='grid gap-4 md:grid-cols-2'>
                <FormTextField
                  name='password'
                  label='Mật khẩu'
                  placeholder='Nhập mật khẩu...'
                  type={showPassword ? 'text' : 'password'}
                  required
                  rightAdornment={
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-foreground transition-colors'
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </button>
                  }
                  validators={{
                    onBlur: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
                  }}
                />
                <FormTextField
                  name='confirm_password'
                  label='Xác nhận mật khẩu'
                  placeholder='Nhập xác nhận mật khẩu...'
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  rightAdornment={
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-foreground transition-colors'
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </button>
                  }
                  validators={{
                    onBlur: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
                  }}
                />
              </div>
            </div>

            <div className='flex justify-end space-x-4 pt-4 border-t'>
              <Button type='button' variant='outline' onClick={() => router.push('/admin/users')}>
                Hủy
              </Button>
              <Button type='submit' form='user-form' disabled={isPending} isLoading={isPending}>
                Tạo mới
              </Button>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
