'use client';

import { useActionState, useEffect, useState } from 'react';
import { adminLoginAction, type AdminLoginState } from '@/features/auth/actions/admin-login';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState: AdminLoginState = {};

interface AdminLoginFormProps {
    redirectTo?: string;
}

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    const [state, formAction, isPending] = useActionState(adminLoginAction, initialState);

    useEffect(() => {
      if (state.success && state.redirectTo) {
        window.location.href = state.redirectTo;
      }
    }, [state]);

    const emailError    = state.fieldErrors?.email;
    const passwordError = state.fieldErrors?.password;

    return (
        <form action={formAction} className='space-y-5' noValidate>
            {redirectTo && <input type='hidden' name='redirectTo' value={redirectTo} />}

            {/* ── Lỗi chung (API error: 401, 403, 500...) ── */}
            {state.error && (
                <div
                    className='rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600'
                    role='alert'
                    aria-live='polite'
                >
                    {state.error}
                </div>
            )}

            {/* ── Email ── */}
            <div className='space-y-1.5'>
                <Label htmlFor='email'>Email quản trị</Label>
                <div className='relative'>
                    <Icons.email className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                        id='email'
                        name='email'
                        type='email'
                        autoComplete='username'
                        defaultValue={state.email}
                        className={`h-11 pl-9 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        placeholder='admin@tutornet.local'
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'email-error' : undefined}
                    />
                </div>
                {/* Field-level error — hiển thị text đỏ dưới input */}
                {emailError && (
                    <p id='email-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {emailError}
                    </p>
                )}
            </div>

            {/* ── Password ── */}
            <div className='space-y-1.5'>
                <div className='flex items-center justify-between gap-3'>
                    <Label htmlFor='password'>Mật khẩu</Label>
                </div>
                <div className='relative'>
                    <Icons.lock className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                        id='password'
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        className={`h-11 pl-9 pr-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        placeholder='••••••••'
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? 'password-error' : undefined}
                    />
                    <Button
                        variant='ghost'
                        size='sm'
                        className='absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        type='button'
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                        {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                    </Button>
                </div>
                {/* Field-level error — hiển thị text đỏ dưới input */}
                {passwordError && (
                    <p id='password-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {passwordError}
                    </p>
                )}
            </div>

            <Button type='submit' className='h-11 w-full font-semibold' disabled={isPending}>
                {isPending ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>
        </form>
    );
}