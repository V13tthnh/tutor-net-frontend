'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { Icons } from '@/components/icons';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { clientLogoutAction } from '@/features/auth/actions/client-logout';

interface FieldErrors {
    password?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export default function SecurityPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthSession();
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showNewConfirm, setShowNewConfirm] = useState(false);
    // State quản lý việc hiển thị form xác nhận xoá tài khoản
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // State cho việc xoá tài khoản
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError('Vui lòng nhập mật khẩu để xác nhận xoá tài khoản');
            return;
        }
        setDeleteError('');
        setDeleting(true);
        try {
            const res = await apiClient<{ success: boolean; message?: string }>(`/users/${user?.id}`, {
                method: 'DELETE',
                body: JSON.stringify({
                    password: deletePassword
                })
            });

            toast.success(res.message || 'Tài khoản của bạn đã được xoá thành công.');
            await clientLogoutAction();
            router.push('/auth/login?reason=deleted');
        } catch (err: any) {
            console.error('Lỗi xoá tài khoản:', err);
            setDeleteError(err?.message || 'Mật khẩu không chính xác hoặc có lỗi xảy ra');
        } finally {
            setDeleting(false);
        }
    };

    // State cho việc đổi mật khẩu
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [successMsg, setSuccessMsg] = useState('');

    const validate = (): FieldErrors => {
        const errs: FieldErrors = {};
        if (!password) errs.password = 'Vui lòng nhập mật khẩu hiện tại';
        if (!newPassword) {
            errs.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (newPassword.length < 8) {
            errs.newPassword = 'Mật khẩu mới phải từ 8 đến 100 ký tự';
        }
        if (!confirmPassword) {
            errs.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu';
        } else if (newPassword && newPassword !== confirmPassword) {
            errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }
        return errs;
    };

    const handleUpdatePassword = async () => {
        setSuccessMsg('');
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        if (!user || !user.id) {
            toast.error('Không tìm thấy thông tin tài khoản');
            return;
        }

        setUpdating(true);
        try {
            const res = await apiClient<{ success: boolean; message?: string }>(`/users/${user.id}/reset-password`, {
                method: 'PATCH',
                body: JSON.stringify({
                    password,
                    newPassword,
                    confirmPassword
                })
            });

            if (res.success) {
                setSuccessMsg(res.message || 'Cập nhật mật khẩu thành công');
                setPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                // Lỗi từ API — hiển thị dưới trường mật khẩu hiện tại (thường là sai mật khẩu)
                setErrors({ password: res.message || 'Cập nhật mật khẩu thất bại' });
            }
        } catch (err: any) {
            console.error('Lỗi đổi mật khẩu:', err);
            setErrors({ password: err?.message || 'Có lỗi xảy ra khi đổi mật khẩu' });
        } finally {
            setUpdating(false);
        }
    };

    const fields = [
        {
            key: 'password' as const,
            label: 'Mật khẩu hiện tại',
            value: password,
            onChange: (v: string) => {
                setPassword(v);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                setSuccessMsg('');
            },
            show: showOld,
            toggle: () => setShowOld(v => !v)
        },
        {
            key: 'newPassword' as const,
            label: 'Mật khẩu mới',
            value: newPassword,
            onChange: (v: string) => {
                setNewPassword(v);
                if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                setSuccessMsg('');
            },
            show: showNew,
            toggle: () => setShowNew(v => !v)
        },
        {
            key: 'confirmPassword' as const,
            label: 'Xác nhận mật khẩu mới',
            value: confirmPassword,
            onChange: (v: string) => {
                setConfirmPassword(v);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                setSuccessMsg('');
            },
            show: showNewConfirm,
            toggle: () => setShowNewConfirm(v => !v)
        },
    ];

    if (authLoading) {
        return (
            <div className='flex items-center justify-center py-10'>
                <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
                <span className='ml-2 text-sm text-muted-foreground'>Đang tải thông tin bảo mật...</span>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {/* ─── ĐỔI MẬT KHẨU ─── */}
            <ScrollReveal variant='fade-up' duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>
                    <h2 className='text-lg font-bold mb-1'>Đổi mật khẩu</h2>
                    <p className='text-sm text-muted-foreground mb-5'>Dùng mật khẩu mạnh để bảo vệ tài khoản của bạn</p>
                    <div className='space-y-4 max-w-sm'>
                        {fields.map((f) => (
                            <div key={f.key} className='space-y-1.5'>
                                <Label className='text-sm'>{f.label}</Label>
                                <div className='relative'>
                                    <Icons.lock size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                                    <Input
                                        type={f.show ? 'text' : 'password'}
                                        placeholder='••••••••'
                                        className={`h-10 pl-9 pr-10 hide-password-toggle ${errors[f.key] ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                                        value={f.value}
                                        onChange={e => f.onChange(e.target.value)}
                                        disabled={updating}
                                    />
                                    <button
                                        type='button'
                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                                        onClick={f.toggle}
                                        disabled={updating}
                                    >
                                        {f.show ? <Icons.eyeOff size={20} /> : <Icons.eye size={20} />}
                                    </button>
                                </div>
                                {errors[f.key] && (
                                    <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
                                        <Icons.alertCircle size={12} className='shrink-0' />
                                        {errors[f.key]}
                                    </p>
                                )}
                            </div>
                        ))}

                        {successMsg && (
                            <div className='flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400'>
                                <Icons.circleCheck size={14} className='shrink-0' />
                                {successMsg}
                            </div>
                        )}

                        <Button
                            className='w-full mt-2'
                            onClick={handleUpdatePassword}
                            disabled={updating}
                        >
                            {updating ? (
                                <><Icons.spinner size={14} className='animate-spin mr-2' />Đang cập nhật...</>
                            ) : 'Cập nhật mật khẩu'}
                        </Button>
                    </div>
                </div>
            </ScrollReveal>

            {/* ─── XÁC THỰC 2 YẾU TỐ ─── */}
            <ScrollReveal variant='fade-up' delay={100} duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>
                    <h2 className='text-lg font-bold mb-1'>Xác thực 2 yếu tố (2FA)</h2>
                    <p className='text-sm text-muted-foreground mb-4'>Tăng cường bảo mật cho tài khoản bằng cách yêu cầu mã xác minh mỗi khi đăng nhập</p>
                    <div className='flex items-center justify-between rounded-xl border p-4 bg-muted/20'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                                <Icons.shieldCheck size={20} className='text-primary' />
                            </div>
                            <div>
                                <p className='font-medium text-sm'>Xác thực qua SMS</p>
                                <p className='text-xs text-muted-foreground'>Nhận mã OTP qua số điện thoại đăng ký</p>
                                <p className='text-[10px] text-amber-600 font-medium mt-0.5' suppressHydrationWarning>*(Tính năng đang được tích hợp cùng nhà mạng)*</p>
                            </div>
                        </div>
                        <Switch disabled />
                    </div>
                </div>
            </ScrollReveal>

            {/* ─── XOÁ TÀI KHOẢN ─── */}
            <ScrollReveal variant='fade-up' delay={200} duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>
                    <div className='flex flex-col sm:flex-row gap-5 items-start'>
                        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40'>
                            <Icons.trash size={22} className='text-red-600 dark:text-red-400' />
                        </div>
                        <div className='flex-1'>
                            <h2 className='text-lg font-bold mb-1 text-red-600 dark:text-red-400'>Xoá tài khoản</h2>
                            <p className='text-sm text-red-600/80 dark:text-red-400/80 mb-5'>
                                Cảnh báo: Hành động này không thể hoàn tác. Toàn bộ dữ liệu, lịch sử hoạt động và thông tin cá nhân của bạn sẽ bị xoá vĩnh viễn khỏi hệ thống.
                            </p>

                            {!showDeleteConfirm ? (
                                <Button
                                    variant='destructive'
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Xoá tài khoản của tôi
                                </Button>
                            ) : (
                                <div className='space-y-4 max-w-sm p-5 border border-red-200 dark:border-red-800 rounded-xl bg-background shadow-sm animate-in fade-in slide-in-from-top-2'>
                                    <div className='space-y-2'>
                                        <Label className='text-sm font-medium text-foreground' htmlFor='delete-confirm-password'>Nhập mật khẩu để xác nhận</Label>
                                        <div className='relative'>
                                            <Icons.lock size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                                            <Input
                                                id='delete-confirm-password'
                                                type='password'
                                                placeholder='••••••••'
                                                className={`h-10 pl-9 pr-4 ${deleteError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                                                value={deletePassword}
                                                onChange={(e) => {
                                                    setDeletePassword(e.target.value);
                                                    if (deleteError) setDeleteError('');
                                                }}
                                                disabled={deleting}
                                            />
                                        </div>
                                        {deleteError && (
                                            <p className='text-xs text-destructive flex items-center gap-1 mt-1'>
                                                <Icons.alertCircle size={12} className='shrink-0' />
                                                {deleteError}
                                            </p>
                                        )}
                                    </div>
                                    <div className='flex gap-3'>
                                        <Button
                                            variant='destructive'
                                            className='flex-1'
                                            onClick={handleDeleteAccount}
                                            disabled={deleting}
                                            isLoading={deleting}
                                        >
                                            Xác nhận xoá
                                        </Button>
                                        <Button
                                            variant='outline'
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeletePassword('');
                                                setDeleteError('');
                                            }}
                                            className='flex-1'
                                            disabled={deleting}
                                        >
                                            Huỷ thao tác
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollReveal>
        </div>
    );
}