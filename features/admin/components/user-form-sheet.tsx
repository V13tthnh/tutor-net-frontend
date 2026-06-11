'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createUserMutation } from '../api/mutations';
import type { User } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import { userSchema, type UserFormValues, GENDER_OPTIONS } from '../schemas/user';
import { ROLE_OPTIONS } from './users-table/options';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Tạm ngưng' },
  { value: 'SUSPENDED', label: 'Bị khóa' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ xác minh' }
];

interface UserFormSheetProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormSheet({ user, open, onOpenChange }: UserFormSheetProps) {
  const isEdit = !!user;

  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('Tạo tài khoản thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('Không thể tạo tài khoản')
  });

  const form = useAppForm({
    defaultValues: {
      first_name: user?.first_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role: user?.role ?? '',
      status: user?.status ? user.status.toUpperCase() : 'ACTIVE',
      gender: (user?.gender ?? 'OTHER') as 'MALE' | 'FEMALE' | 'OTHER',
      password: '',
      confirm_password: ''
    } as UserFormValues,
    validators: {
      onSubmit: userSchema
    },
    onSubmit: async ({ value }) => {
      if (!isEdit) {
        await createMutation.mutateAsync(value);
      }
      // Note: Edit mode không dùng sheet này - dùng user-edit-form.tsx thay thế
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UserFormValues>();

  const isPending = createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Chi tiết người dùng' : 'Tạo người dùng mới'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Xem thông tin người dùng (chỉ đọc).'
              : 'Điền thông tin để tạo tài khoản quản trị viên mới.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <FormTextField
                name='first_name'
                label='Họ và tên'
                required
                placeholder='Nguyễn Văn A'
                validators={{
                  onBlur: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự')
                }}
              />

              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                disabled={isEdit}
                placeholder='admin@example.com'
                validators={{
                  onBlur: z.string().email('Email không đúng định dạng')
                }}
              />

              <FormTextField
                name='phone'
                label='Số điện thoại'
                type='tel'
                placeholder='+84 912 345 678'
                validators={{
                  onBlur: z.string().max(20, 'Số điện thoại không được vượt quá 20 ký tự').optional().or(z.literal(''))
                }}
              />

              <FormSelectField
                name='role'
                label='Vai trò'
                required
                options={ROLE_OPTIONS}
                placeholder='Chọn vai trò'
                validators={{
                  onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
                }}
              />

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

              <FormSelectField
                name='gender'
                label='Giới tính'
                required
                options={GENDER_OPTIONS}
                placeholder='Chọn giới tính'
              />

              {!isEdit && (
                <>
                  <FormTextField
                    name='password'
                    label='Mật khẩu'
                    required
                    type='password'
                    placeholder='Nhập mật khẩu...'
                    validators={{
                      onBlur: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
                    }}
                  />
                  <FormTextField
                    name='confirm_password'
                    label='Xác nhận mật khẩu'
                    required
                    type='password'
                    placeholder='Nhập lại mật khẩu...'
                    validators={{
                      onBlur: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
                    }}
                  />
                </>
              )}
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          {!isEdit && (
            <Button type='submit' form='user-form-sheet' isLoading={isPending}>
              <Icons.check /> Tạo mới
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm người dùng
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
