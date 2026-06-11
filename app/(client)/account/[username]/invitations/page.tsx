'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import { ScrollReveal } from '@/hooks/use-scroll-reveal';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Invitation {
    id: number;
    studentUserId: number | null;
    studentName: string;
    studentPhone: string;
    studentEmail: string;
    message: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

interface PageResponse {
    content: Invitation[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvitationsPage() {
    const { user, loading: authLoading } = useAuthSession();
    const [data, setData] = useState<PageResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter, sort & pagination
    const [status, setStatus] = useState<string>('ALL');
    const [sortOption, setSortOption] = useState<string>('createdAt:desc');
    const [page, setPage] = useState(1);

    // UI state
    const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    // invite pending reject-confirm dialog
    const [confirmRejectInvite, setConfirmRejectInvite] = useState<Invitation | null>(null);

    const [sortBy, sortDir] = sortOption.split(':');

    // ── Data fetching ──
    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/tutor/invitations?page=${page}&size=10&sortBy=${sortBy}&sortDir=${sortDir}`;
            if (status !== 'ALL') url += `&status=${status}`;
            const res = await apiClient<PageResponse>(url);
            setData(res);
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách lời mời:', err);
            toast.error(err?.message || 'Có lỗi xảy ra khi tải danh sách lời mời.');
        } finally {
            setLoading(false);
        }
    }, [page, status, sortBy, sortDir]);

    useEffect(() => {
        if (user?.roles.includes('tutor')) fetchInvitations();
    }, [user, fetchInvitations]);

    // Reset về trang 1 khi thay đổi filter / sort
    useEffect(() => { setPage(1); }, [status, sortOption]);

    // ── Accept invitation ──
    const handleAccept = useCallback(async (invite: Invitation) => {
        if (acceptingId !== null) return;
        setAcceptingId(invite.id);
        try {
            await apiClient(`/tutor/invitations/${invite.id}/accept`, { method: 'PATCH' });
            toast.success(`Đã chấp nhận lời mời từ ${invite.studentName}! Hợp đồng sẽ được tạo ngay.`);
            // Cập nhật local state để không cần refetch toàn bộ
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    content: prev.content.map(item =>
                        item.id === invite.id ? { ...item, status: 'ACCEPTED' as const } : item
                    ),
                };
            });
            // Nếu modal đang mở cho invite này, cập nhật luôn
            if (selectedInvite?.id === invite.id) {
                setSelectedInvite({ ...invite, status: 'ACCEPTED' });
            }
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi xảy ra khi chấp nhận lời mời.');
        } finally {
            setAcceptingId(null);
        }
    }, [acceptingId, selectedInvite]);

    // ── Reject invitation ──
    const handleReject = useCallback(async (invite: Invitation) => {
        if (rejectingId !== null) return;
        setRejectingId(invite.id);
        setConfirmRejectInvite(null); // close confirm dialog
        try {
            await apiClient(`/tutor/invitations/${invite.id}/reject`, { method: 'PATCH' });
            toast.info(`Đã từ chối lời mời từ ${invite.studentName}.`);
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    content: prev.content.map(item =>
                        item.id === invite.id ? { ...item, status: 'REJECTED' as const } : item
                    ),
                };
            });
            if (selectedInvite?.id === invite.id) {
                setSelectedInvite({ ...invite, status: 'REJECTED' });
            }
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi xảy ra khi từ chối lời mời.');
        } finally {
            setRejectingId(null);
        }
    }, [rejectingId, selectedInvite]);

    // ── Formatting ──
    const formatInviteDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    // ── Guards ──
    if (authLoading) {
        return (
            <div className='flex items-center justify-center py-10'>
                <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
                <span className='ml-2 text-sm text-muted-foreground'>Đang tải thông tin tài khoản...</span>
            </div>
        );
    }

    if (!user || !user.roles.includes('tutor')) {
        return (
            <ScrollReveal variant='fade-up' duration={600}>
                <div className='rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/40 p-8 text-center shadow-sm'>
                    <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-5'>
                        <Icons.warning size={26} />
                    </div>
                    <h2 className='text-lg font-bold text-foreground mb-2'>Trang này dành riêng cho Gia sư</h2>
                    <p className='text-sm text-muted-foreground mb-6 max-w-md mx-auto'>
                        Để xem và quản lý các lời mời dạy học từ học viên, vui lòng đăng ký tài khoản làm gia sư trên hệ thống của chúng tôi.
                    </p>
                    <Button asChild>
                        <Link href={`/account/${user?.email.split('@')[0]}/new-cv`}>
                            <Icons.cv size={16} className='mr-2' />Đăng ký làm gia sư
                        </Link>
                    </Button>
                </div>
            </ScrollReveal>
        );
    }

    const invitations = data?.content || [];
    const totalPages = data?.totalPages || 0;
    const totalElements = data?.totalElements || 0;

    // ── Sub-components ──

    const STATUS_FILTERS = [
        { label: 'Tất cả', value: 'ALL' },
        { label: 'Chờ phản hồi', value: 'PENDING' },
        { label: 'Đã nhận', value: 'ACCEPTED' },
        { label: 'Đã từ chối', value: 'REJECTED' },
    ];

    function StatusBadge({ value }: { value: string }) {
        switch (value) {
            case 'PENDING':
                return <Badge className='bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900 hover:bg-amber-100'>Chờ phản hồi</Badge>;
            case 'ACCEPTED':
                return <Badge className='bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100'>Đã đồng ý</Badge>;
            case 'REJECTED':
                return <Badge className='bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900 hover:bg-rose-100'>Đã từ chối</Badge>;
            default:
                return <Badge variant='secondary'>{value}</Badge>;
        }
    }

    /** Hiển thị contact — server đã xử lý masking, render thẳng giá trị trả về */
    function ContactDisplay({ invite, compact = false }: { invite: Invitation; compact?: boolean }) {
        return (
            <div className={cn('space-y-1', compact ? 'text-xs' : 'text-sm')}>
                <p className='flex items-center gap-1.5 font-foreground text-primary w-fit'>
                    <Icons.phone size={compact ? 11 : 13} />
                    {invite.studentPhone}
                </p>
                <p className='flex items-center gap-1.5 font-foreground text-primary w-fit'>
                    <Icons.email size={compact ? 11 : 13} />
                    {invite.studentEmail}
                </p>
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes rowFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>

            <ScrollReveal variant='fade-up' duration={650} threshold={0.05}>
                <div className='rounded-2xl border bg-card shadow-sm p-6'>

                    {/* Header */}
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6'>
                        <div>
                            <h2 className='text-xl font-bold tracking-tight'>Lời mời giảng dạy</h2>
                            <p className='text-sm text-muted-foreground mt-1'>
                                Danh sách học sinh/phụ huynh gửi lời mời dạy học trực tiếp cho bạn
                            </p>
                        </div>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border w-fit shrink-0'>
                            <Icons.email size={15} className='text-primary' />
                            <span>Tổng số lời mời: <strong>{totalElements}</strong></span>
                        </div>
                    </div>

                    {/* Filters & Sort */}
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
                        <div className='flex flex-wrap gap-1.5 border-b md:border-b-0 pb-3 md:pb-0'>
                            {STATUS_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setStatus(f.value)}
                                    className={cn(
                                        'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border',
                                        status === f.value
                                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-input'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className='flex items-center gap-2 self-end md:self-auto shrink-0'>
                            <span className='text-xs text-muted-foreground shrink-0'>Sắp xếp:</span>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className='w-48 h-9 text-xs'>
                                    <SelectValue placeholder='Chọn kiểu sắp xếp' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='createdAt:desc' className='text-xs'>Mới nhất</SelectItem>
                                    <SelectItem value='createdAt:asc' className='text-xs'>Cũ nhất</SelectItem>
                                    <SelectItem value='studentName:asc' className='text-xs'>Tên học viên (A-Z)</SelectItem>
                                    <SelectItem value='studentName:desc' className='text-xs'>Tên học viên (Z-A)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content area */}
                    {loading ? (
                        <div className='flex flex-col items-center justify-center py-20 gap-3'>
                            <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
                            <span className='text-sm text-muted-foreground'>Đang tải danh sách lời mời...</span>
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/10'>
                            <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground'>
                                <Icons.email size={24} />
                            </div>
                            <p className='text-foreground font-semibold'>Không tìm thấy lời mời nào</p>
                            <p className='text-muted-foreground mt-1 text-sm max-w-xs'>
                                Thử thay đổi trạng thái lọc hoặc kiểm tra lại sau.
                            </p>
                        </div>
                    ) : (
                        <div className='space-y-6'>

                            {/* ── Desktop Table ── */}
                            <div className='hidden md:block overflow-x-auto rounded-xl border bg-background'>
                                <table className='w-full text-sm text-left border-collapse'>
                                    <thead>
                                        <tr className='border-b bg-muted/40 text-muted-foreground text-xs font-semibold'>
                                            <th className='p-4'>Người gửi</th>
                                            <th className='p-4'>Liên hệ</th>
                                            <th className='p-4'>Ngày nhận</th>
                                            <th className='p-4 max-w-[200px]'>Lời nhắn</th>
                                            <th className='p-4 text-center'>Trạng thái</th>
                                            <th className='p-4 text-right'>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invitations.map((invite, index) => {
                                            const isAccepting = acceptingId === invite.id;
                                            const isRejecting = rejectingId === invite.id;
                                            return (
                                                <tr
                                                    key={invite.id}
                                                    className='border-b last:border-0 hover:bg-muted/30 transition-colors'
                                                    style={{ animation: `rowFadeIn 400ms cubic-bezier(0.22,1,0.36,1) ${index * 50}ms both` }}
                                                >
                                                    <td className='p-4 font-semibold text-foreground'>{invite.studentName}</td>

                                                    {/* Contact — masked when PENDING */}
                                                    <td className='p-4'>
                                                        <ContactDisplay invite={invite} compact />
                                                    </td>

                                                    <td className='p-4 text-xs text-muted-foreground whitespace-nowrap'>
                                                        {formatInviteDate(invite.createdAt)}
                                                    </td>

                                                    <td className='p-4 text-xs max-w-[200px] truncate text-muted-foreground'>
                                                        {invite.message || <em className='text-muted-foreground/40'>(Không có lời nhắn)</em>}
                                                    </td>

                                                    <td className='p-4 text-center'>
                                                        <StatusBadge value={invite.status} />
                                                    </td>

                                                    {/* Actions */}
                                                    <td className='p-4'>
                                                        <div className='flex items-center justify-end gap-1.5'>
                                                            {/* Accept icon button — only for PENDING */}
                                                            {invite.status === 'PENDING' && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={() => handleAccept(invite)}
                                                                            disabled={isAccepting}
                                                                            aria-label='Chấp nhận lời mời'
                                                                            className={cn(
                                                                                'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                                                                                isAccepting
                                                                                    ? 'cursor-not-allowed opacity-50 bg-muted border-input'
                                                                                    : 'cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/40'
                                                                            )}
                                                                        >
                                                                            {isAccepting
                                                                                ? <Icons.spinner size={14} className='animate-spin' />
                                                                                : <Icons.circleCheck size={15} />
                                                                            }
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side='top'>
                                                                        Chấp nhận lời mời dạy
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}

                                                            {/* Reject icon button — only for PENDING */}
                                                            {invite.status === 'PENDING' && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={() => setConfirmRejectInvite(invite)}
                                                                            disabled={isRejecting}
                                                                            aria-label='Từ chối lời mời'
                                                                            className={cn(
                                                                                'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
                                                                                isRejecting
                                                                                    ? 'cursor-not-allowed opacity-50 bg-muted border-input'
                                                                                    : 'cursor-pointer border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/40'
                                                                            )}
                                                                        >
                                                                            {isRejecting
                                                                                ? <Icons.spinner size={14} className='animate-spin' />
                                                                                : <Icons.close size={14} />
                                                                            }
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side='top'>
                                                                        Từ chối lời mời dạy
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}

                                                            {/* View details button */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => setSelectedInvite(invite)}
                                                                        aria-label='Xem chi tiết'
                                                                        className='flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer'
                                                                    >
                                                                        <Icons.eye size={15} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side='top'>
                                                                    Xem chi tiết
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Mobile Card List ── */}
                            <div className='md:hidden space-y-4'>
                                {invitations.map((invite, index) => {
                                    const isAccepting = acceptingId === invite.id;
                                    const isRejecting = rejectingId === invite.id;
                                    return (
                                        <div
                                            key={invite.id}
                                            className='rounded-xl border bg-background p-4 shadow-sm space-y-3'
                                            style={{ animation: `rowFadeIn 450ms cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both` }}
                                        >
                                            {/* Name + status */}
                                            <div className='flex items-center justify-between gap-2'>
                                                <span className='font-bold text-sm text-foreground'>{invite.studentName}</span>
                                                <StatusBadge value={invite.status} />
                                            </div>

                                            {/* Date */}
                                            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                                <Icons.calendar size={12} className='text-muted-foreground/70' />
                                                <span>{formatInviteDate(invite.createdAt)}</span>
                                            </div>

                                            {/* Message */}
                                            {invite.message ? (
                                                <p className='text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40 line-clamp-3'>
                                                    "{invite.message}"
                                                </p>
                                            ) : (
                                                <p className='text-xs italic text-muted-foreground/50'>
                                                    (Không có lời nhắn)
                                                </p>
                                            )}

                                            {/* Contact — masked when PENDING, shown when ACCEPTED */}
                                            <div className='rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5'>
                                                <ContactDisplay invite={invite} compact />
                                            </div>

                                            {/* Action buttons */}
                                            <div className='flex gap-2 pt-1'>
                                                {invite.status === 'PENDING' && (<>
                                                    <Button
                                                        size='sm'
                                                        disabled={isAccepting}
                                                        onClick={() => handleAccept(invite)}
                                                        className='flex-1 h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer'
                                                    >
                                                        {isAccepting
                                                            ? <><Icons.spinner size={13} className='animate-spin' />Đang xử lý...</>
                                                            : <><Icons.circleCheck size={13} />Chấp nhận</>
                                                        }
                                                    </Button>
                                                    <Button
                                                        size='sm'
                                                        variant='outline'
                                                        disabled={isRejecting}
                                                        onClick={() => setConfirmRejectInvite(invite)}
                                                        className='flex-1 h-9 text-xs gap-1.5 text-foreground cursor-pointer'
                                                    >
                                                        {isRejecting
                                                            ? <><Icons.spinner size={13} className='animate-spin' />Đang xử lý...</>
                                                            : <><Icons.close size={13} />Từ chối</>
                                                        }
                                                    </Button>
                                                </>)}
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    className='flex-1 h-9 text-xs cursor-pointer gap-1.5'
                                                    onClick={() => setSelectedInvite(invite)}
                                                >
                                                    <Icons.eye size={13} />
                                                    Xem chi tiết
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Pagination ── */}
                            {totalPages > 1 && (
                                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 mt-2'>
                                    <p className='text-xs text-muted-foreground text-center sm:text-left'>
                                        Hiển thị {Math.min((page - 1) * 10 + 1, totalElements)} –{' '}
                                        {Math.min(page * 10, totalElements)} trong tổng số <strong>{totalElements}</strong> lời mời
                                    </p>
                                    <div className='flex items-center gap-1.5'>
                                        <Button
                                            variant='outline' size='icon' className='h-8 w-8'
                                            disabled={page <= 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            <Icons.chevronLeft size={16} />
                                        </Button>

                                        {Array.from({ length: totalPages }).map((_, i) => {
                                            const p = i + 1;
                                            if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                                                return (
                                                    <Button key={p} variant={p === page ? 'default' : 'outline'}
                                                        className='h-8 w-8 text-xs' onClick={() => setPage(p)}>
                                                        {p}
                                                    </Button>
                                                );
                                            }
                                            if (p === page - 2 || p === page + 2) {
                                                return <span key={p} className='px-1 text-muted-foreground text-xs'>...</span>;
                                            }
                                            return null;
                                        })}

                                        <Button
                                            variant='outline' size='icon' className='h-8 w-8'
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        >
                                            <Icons.chevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollReveal>

            {/* ══ Details Dialog ══════════════════════════════════════════════════ */}
            <Dialog open={selectedInvite !== null} onOpenChange={(v) => !v && setSelectedInvite(null)}>
                <DialogContent className='flex w-[95vw] max-w-lg flex-col overflow-hidden rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden'>
                    <DialogTitle className='sr-only'>Chi tiết lời mời giảng dạy</DialogTitle>

                    {/* Dialog Header */}
                    <header className='flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground'>
                        <span className='font-bold text-base tracking-wide flex items-center gap-2'>
                            <Icons.email size={18} />
                            Chi tiết lời mời dạy
                        </span>
                        <button
                            type='button'
                            onClick={() => setSelectedInvite(null)}
                            aria-label='Đóng'
                            className='rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer'
                        >
                            <Icons.close size={18} />
                        </button>
                    </header>

                    {/* Dialog Body */}
                    {selectedInvite && (
                        <div className='p-6 space-y-5 overflow-y-auto max-h-[70vh]'>
                            {/* Student info row */}
                            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4'>
                                <div className='flex items-center gap-3'>
                                    <div className='h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20'>
                                        {selectedInvite.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className='font-bold text-sm text-foreground'>{selectedInvite.studentName}</h4>
                                        <p className='text-xs text-muted-foreground'>Học viên / Phụ huynh</p>
                                    </div>
                                </div>
                                <StatusBadge value={selectedInvite.status} />
                            </div>

                            {/* Contact info */}
                            <div className='space-y-3 bg-muted/30 p-4 rounded-xl border border-border/60'>
                                <h5 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2'>
                                    Thông tin liên hệ
                                </h5>
                                <ContactDisplay invite={selectedInvite} />
                                <div className='pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5'>
                                    <Icons.calendar size={13} />
                                    <span>Đã gửi vào lúc {formatInviteDate(selectedInvite.createdAt)}</span>
                                </div>
                            </div>

                            {/* Message */}
                            <div className='space-y-2.5'>
                                <h5 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                                    Nội dung lời nhắn
                                </h5>
                                <div className='rounded-xl border border-border/60 bg-background/50 p-4 min-h-[90px] text-sm text-foreground leading-relaxed whitespace-pre-wrap shadow-inner'>
                                    {selectedInvite.message
                                        ? selectedInvite.message
                                        : <span className='italic text-muted-foreground/60'>Học viên không để lại lời nhắn. Hãy liên lạc trực tiếp sau khi chấp nhận lời mời.</span>
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dialog Footer */}
                    <DialogFooter className='px-6 py-4 bg-muted/20 border-t gap-2 flex-row justify-end'>
                        {/* Reject button — only when PENDING */}
                        {selectedInvite?.status === 'PENDING' && (
                            <Button
                                variant='outline'
                                className='gap-2 h-9 px-5 cursor-pointer'
                                disabled={rejectingId === selectedInvite.id}
                                onClick={() => setConfirmRejectInvite(selectedInvite)}
                            >
                                {rejectingId === selectedInvite.id
                                    ? <><Icons.spinner size={14} className='animate-spin' />Đang xử lý...</>
                                    : <><Icons.close size={14} />Từ chối</>
                                }
                            </Button>
                        )}
                        {/* Accept button — only when PENDING */}
                        {selectedInvite?.status === 'PENDING' && (
                            <Button
                                className='gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer h-9 px-5'
                                disabled={acceptingId === selectedInvite.id}
                                onClick={() => handleAccept(selectedInvite)}
                            >
                                {acceptingId === selectedInvite.id
                                    ? <><Icons.spinner size={14} className='animate-spin' />Đang xử lý...</>
                                    : <><Icons.circleCheck size={15} />Chấp nhận</>
                                }
                            </Button>
                        )}

                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══ Reject Confirmation Dialog ══════════════════════════════════════ */}
            <Dialog open={confirmRejectInvite !== null} onOpenChange={(v) => !v && setConfirmRejectInvite(null)}>
                <DialogContent className='w-[95vw] max-w-md rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden'>
                    <DialogTitle className='sr-only'>Xác nhận từ chối lời mời</DialogTitle>

                    {/* Warning header */}
                    <header className='flex shrink-0 items-center justify-between px-6 py-4 bg-rose-600 text-white rounded-t-xl'>
                        <span className='font-bold text-base flex items-center gap-2'>
                            <Icons.warning size={18} />
                            Xác nhận từ chối lời mời
                        </span>
                        <button
                            type='button'
                            onClick={() => setConfirmRejectInvite(null)}
                            aria-label='Đóng'
                            className='rounded-full p-1.5 hover:bg-white/10 transition-colors cursor-pointer'
                        >
                            <Icons.close size={18} />
                        </button>
                    </header>

                    {/* Body */}
                    {confirmRejectInvite && (
                        <div className='px-6 py-5 space-y-4'>
                            <div className='flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-4'>
                                <Icons.warning size={20} className='text-rose-600 dark:text-rose-400 mt-0.5 shrink-0' />
                                <div className='text-sm'>
                                    <p className='font-semibold text-rose-700 dark:text-rose-300 mb-1'>Bạn sắp từ chối lời mời này!</p>
                                    <p className='text-rose-600/80 dark:text-rose-400/80 leading-relaxed'>
                                        Lời mời từ <strong>{confirmRejectInvite.studentName}</strong> sẽ bị từ chối và không thể hoàn tác.
                                        Học viên sẽ phải gửi lời mời mới nếu muốn tiếp tục.
                                    </p>
                                </div>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Bạn có chắc chắn muốn <strong>từ chối</strong> lời mời dạy học từ
                                <strong> {confirmRejectInvite.studentName}</strong> không?
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className='px-6 py-4 bg-muted/20 border-t flex flex-row justify-end gap-2 rounded-b-xl'>
                        <Button
                            variant='outline'
                            className='h-9 px-5 cursor-pointer'
                            onClick={() => setConfirmRejectInvite(null)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className='h-9 px-5 gap-2 bg-rose-600 hover:bg-rose-700 text-white border-0 cursor-pointer'
                            disabled={rejectingId === confirmRejectInvite?.id}
                            onClick={() => confirmRejectInvite && handleReject(confirmRejectInvite)}
                        >
                            {rejectingId === confirmRejectInvite?.id
                                ? <><Icons.spinner size={14} className='animate-spin' />Đang xử lý...</>
                                : <><Icons.close size={14} />Xác nhận từ chối</>
                            }
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
