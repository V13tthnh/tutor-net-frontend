'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import { getContractPreview, acceptAndSignContract, rejectInvitation } from '@/features/tutors/api/service';
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
    subjectName: string;
    proposedPrice: number;
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

    // New Accept/Reject flow states
    const [contractPreviewInvite, setContractPreviewInvite] = useState<Invitation | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

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

    // ── Open contract preview modal ──
    const handleOpenContractPreview = useCallback(async (invite: Invitation) => {
        setContractPreviewInvite(invite);
        setPreviewData(null);
        setLoadingPreview(true);
        setIsAgreed(false);
        try {
            const res = await getContractPreview(invite.id);
            if (res.success) {
                setPreviewData(res.data);
            } else {
                toast.error(res.message || 'Không thể tải bản nháp hợp đồng.');
                setContractPreviewInvite(null);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Không thể tải bản nháp hợp đồng.');
            setContractPreviewInvite(null);
        } finally {
            setLoadingPreview(false);
        }
    }, []);

    // ── Confirm sign contract ──
    const handleConfirmSign = useCallback(async () => {
        if (!contractPreviewInvite || acceptingId !== null) return;
        setAcceptingId(contractPreviewInvite.id);
        try {
            await acceptAndSignContract(contractPreviewInvite.id);
            toast.success(`Ký hợp đồng và nhận lớp thành công! Vui lòng kiểm tra Email để nhận file đính kèm.`);

            // Cập nhật local state
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    content: prev.content.map(item =>
                        item.id === contractPreviewInvite.id ? { ...item, status: 'ACCEPTED' as const } : item
                    ),
                };
            });

            if (selectedInvite?.id === contractPreviewInvite.id) {
                setSelectedInvite({ ...contractPreviewInvite, status: 'ACCEPTED' });
            }

            setContractPreviewInvite(null);
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi xảy ra khi ký hợp đồng và nhận lớp.');
        } finally {
            setAcceptingId(null);
        }
    }, [contractPreviewInvite, acceptingId, selectedInvite]);

    // ── Open reject confirmation ──
    const handleOpenRejectConfirm = useCallback((invite: Invitation) => {
        setConfirmRejectInvite(invite);
        setRejectReason("");
    }, []);

    // ── Reject invitation ──
    const handleReject = useCallback(async (invite: Invitation) => {
        if (rejectingId !== null) return;
        setRejectingId(invite.id);
        setConfirmRejectInvite(null); // close confirm dialog
        try {
            await rejectInvitation(invite.id, rejectReason);
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
            setRejectReason("");
        } catch (err: any) {
            toast.error(err?.message || 'Có lỗi xảy ra khi từ chối lời mời.');
        } finally {
            setRejectingId(null);
        }
    }, [rejectingId, selectedInvite, rejectReason]);

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
                            <div className='hidden md:block overflow-x-auto rounded-xl border bg-background shadow-sm'>
                                <table className='w-full text-sm text-left border-collapse'>
                                    <thead>
                                        <tr className='border-b bg-muted/40 text-muted-foreground text-xs font-bold uppercase tracking-wider font-sans'>
                                            <th className='p-4 pl-5'>Môn học</th>
                                            <th className='p-4 text-right'>Học phí đề xuất</th>
                                            <th className='p-4'>Người đại diện</th>
                                            <th className='p-4'>Thông tin liên hệ</th>
                                            <th className='p-4 text-center'>Trạng thái</th>
                                            <th className='p-4 text-right pr-5'>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invitations.map((invite, index) => {
                                            const isRejecting = rejectingId === invite.id;
                                            return (
                                                <tr
                                                    key={invite.id}
                                                    className='border-b last:border-0 hover:bg-muted/30 transition-colors'
                                                    style={{ animation: `rowFadeIn 400ms cubic-bezier(0.22,1,0.36,1) ${index * 50}ms both` }}
                                                >
                                                    {/* Cột 1: Môn học (Điểm nhấn thương hiệu) */}
                                                    <td className='p-4 pl-5 font-bold text-primary text-sm uppercase tracking-wide whitespace-nowrap'>
                                                        {invite.subjectName}
                                                    </td>

                                                    {/* Cột 2: Học phí (Căn phải chuẩn chỉ) */}
                                                    <td className='p-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm'>
                                                        {invite.proposedPrice?.toLocaleString('vi-VN')} đ/tháng
                                                    </td>

                                                    {/* Cột 3: Người đại diện */}
                                                    <td className='p-4 font-medium text-foreground whitespace-nowrap'>
                                                        {invite.studentName}
                                                    </td>

                                                    {/* Cột 4: Liên hệ */}
                                                    <td className='p-4 min-w-[160px]'>
                                                        <ContactDisplay invite={invite} compact />
                                                    </td>

                                                    {/* Cột 5: Trạng thái */}
                                                    <td className='p-4 text-center whitespace-nowrap'>
                                                        <StatusBadge value={invite.status} />
                                                    </td>

                                                    {/* Cột 6: Hành động */}
                                                    <td className='p-4 pr-5 text-right'>
                                                        <div className='flex items-center justify-end gap-1.5'>
                                                            {invite.status === 'PENDING' && (
                                                                <>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                onClick={() => handleOpenContractPreview(invite)}
                                                                                disabled={loadingPreview && contractPreviewInvite?.id === invite.id}
                                                                                className={cn(
                                                                                    'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer',
                                                                                    loadingPreview && contractPreviewInvite?.id === invite.id
                                                                                        ? 'opacity-50 bg-muted'
                                                                                        : 'bg-background text-rose-600 hover:bg-muted hover:text-foreground text-emerald-700'
                                                                                )}
                                                                            >
                                                                                {loadingPreview && contractPreviewInvite?.id === invite.id
                                                                                    ? <Icons.spinner size={14} className='animate-spin' />
                                                                                    : <Icons.circleCheck size={15} />
                                                                                }
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side='top'>Chấp nhận</TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                onClick={() => handleOpenRejectConfirm(invite)}
                                                                                disabled={isRejecting}
                                                                                className={cn(
                                                                                    'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer',
                                                                                    isRejecting ? 'opacity-50 bg-background' : 'bg-background text-rose-600 hover:bg-muted hover:text-foreground'
                                                                                )}
                                                                            >
                                                                                {isRejecting
                                                                                    ? <Icons.spinner size={14} className='animate-spin' />
                                                                                    : <Icons.close size={14} />
                                                                                }
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side='top'>Từ chối</TooltipContent>
                                                                    </Tooltip>
                                                                </>
                                                            )}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => setSelectedInvite(invite)}
                                                                        className='flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer'
                                                                    >
                                                                        <Icons.eye size={15} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side='top'>Xem chi tiết</TooltipContent>
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
                                    const isRejecting = rejectingId === invite.id;
                                    return (
                                        <div
                                            key={invite.id}
                                            className='rounded-xl border bg-background p-4 shadow-sm space-y-3'
                                            style={{ animation: `rowFadeIn 450ms cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both` }}
                                        >
                                            {/* Name + status */}
                                            <div className='flex items-start justify-between gap-2 border-b border-border/50 pb-3'>
                                                <div>
                                                    <h4 className='font-bold text-base text-primary uppercase leading-tight mb-1'>
                                                        {invite.subjectName}
                                                    </h4>
                                                    <div className='inline-block bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold px-2 py-0.5 rounded text-sm'>
                                                        {invite.proposedPrice?.toLocaleString('vi-VN')} đ/tháng
                                                    </div>
                                                </div>
                                                <div className="shrink-0 mt-0.5">
                                                    <StatusBadge value={invite.status} />
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className='flex flex-col gap-1.5 pt-1'>
                                                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                                    <Icons.user size={12} className='text-muted-foreground/70' />
                                                    <span>Người mời: <strong className="text-foreground">{invite.studentName}</strong></span>
                                                </div>
                                                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                                    <Icons.calendar size={12} className='text-muted-foreground/70' />
                                                    <span>{formatInviteDate(invite.createdAt)}</span>
                                                </div>
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
                                                        disabled={loadingPreview && contractPreviewInvite?.id === invite.id}
                                                        onClick={() => handleOpenContractPreview(invite)}
                                                        className='flex-1 h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer'
                                                    >
                                                        {loadingPreview && contractPreviewInvite?.id === invite.id
                                                            ? <><Icons.spinner size={13} className='animate-spin' />Đang tải...</>
                                                            : <><Icons.circleCheck size={13} />Chấp nhận</>
                                                        }
                                                    </Button>
                                                    <Button
                                                        size='sm'
                                                        variant='outline'
                                                        disabled={isRejecting}
                                                        onClick={() => handleOpenRejectConfirm(invite)}
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
                <DialogContent className='flex w-[95vw] max-w-5xl flex-col overflow-hidden rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden'>
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
                            <div className='flex items-center gap-3 border-b pb-4'>
                                <div className='h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20'>
                                    {selectedInvite.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className='font-bold text-sm text-foreground'>{selectedInvite.studentName}</h4>
                                    <p className='text-xs text-muted-foreground'>Học viên / Phụ huynh đại diện</p>
                                </div>
                                <div className="ml-auto">
                                    <StatusBadge value={selectedInvite.status} />
                                </div>
                            </div>

                            {/* Contact info */}
                            <div className='grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10 shadow-inner'>
                                <div>
                                    <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1'>Môn học giảng dạy</span>
                                    <span className='font-extrabold text-sm text-primary uppercase'>{selectedInvite.subjectName}</span>
                                </div>
                                <div className='text-right'>
                                    <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1'>Mức học phí đề xuất</span>
                                    <span className='font-extrabold text-sm text-rose-600 dark:text-rose-400'>
                                        {selectedInvite.proposedPrice?.toLocaleString('vi-VN')} đ/tháng
                                    </span>
                                </div>
                            </div>

                            <div className='space-y-3 bg-muted/40 p-4 rounded-xl border border-border/60'>
                                <h5 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2'>
                                    Thông tin liên lạc bảo mật
                                </h5>
                                <ContactDisplay invite={selectedInvite} />
                                <div className='pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1.5'>
                                    <Icons.calendar size={13} />
                                    <span>Hệ thống nhận yêu cầu vào lúc {formatInviteDate(selectedInvite.createdAt)}</span>
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
                                onClick={() => handleOpenRejectConfirm(selectedInvite)}
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
                                disabled={loadingPreview && contractPreviewInvite?.id === selectedInvite.id}
                                onClick={() => {
                                    handleOpenContractPreview(selectedInvite);
                                    setSelectedInvite(null); // Đóng modal chi tiết
                                }}
                            >
                                {loadingPreview && contractPreviewInvite?.id === selectedInvite.id
                                    ? <><Icons.spinner size={14} className='animate-spin' />Đang tải...</>
                                    : <><Icons.circleCheck size={15} />Chấp nhận</>
                                }
                            </Button>
                        )}

                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* ══ Reject Confirmation Dialog ══════════════════════════════════════ */}
            < Dialog open={confirmRejectInvite !== null
            } onOpenChange={(v) => !v && setConfirmRejectInvite(null)}>
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
                        <div className='px-6 py-5 space-y-4 text-left'>
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

                            <div className="space-y-1.5 pt-2">
                                <label htmlFor="reject-reason-input" className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-sans">
                                    Lý do từ chối (Không bắt buộc)
                                </label>
                                <textarea
                                    id="reject-reason-input"
                                    className="w-full min-h-[90px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
                                    placeholder="Ví dụ: Lịch dạy không phù hợp, đã kín lịch..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className='px-6 py-4 bg-muted/20 border-t flex flex-row justify-end gap-2 rounded-b-xl'>
                        <Button
                            variant='outline'
                            className='h-9 px-5 cursor-pointer text-xs'
                            onClick={() => setConfirmRejectInvite(null)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            className='h-9 px-5 gap-2 bg-rose-600 hover:bg-rose-700 text-white border-0 cursor-pointer text-xs'
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
            </Dialog >

            {/* ══ Contract Preview & Sign Dialog ══════════════════════════════════ */}
            < Dialog open={contractPreviewInvite !== null} onOpenChange={(v) => !v && setContractPreviewInvite(null)}>
                <DialogContent className='flex w-[95vw] max-w-4xl flex-col overflow-hidden rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden'>
                    <DialogTitle className='sr-only'>Hợp đồng dịch vụ và nhận lớp học</DialogTitle>

                    {/* Dialog Header */}
                    <header className='flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground'>
                        <span className='font-bold text-base tracking-wide flex items-center gap-2'>
                            <Icons.cv size={18} />
                            Hợp đồng dịch vụ và nhận lớp học (Bản nháp)
                        </span>
                        <button
                            type='button'
                            onClick={() => setContractPreviewInvite(null)}
                            aria-label='Đóng'
                            className='rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer'
                        >
                            <Icons.close size={18} />
                        </button>
                    </header>

                    {/* Dialog Body */}
                    <div className='p-6 overflow-y-auto max-h-[70vh] bg-neutral-100 dark:bg-neutral-900/40 text-neutral-800 dark:text-neutral-200'>
                        {loadingPreview ? (
                            <div className='flex flex-col items-center justify-center py-20 gap-3'>
                                <Icons.spinner className='h-8 w-8 animate-spin text-primary' />
                                <span className='text-sm text-muted-foreground'>Đang tải thông tin hợp đồng nháp...</span>
                            </div>
                        ) : !previewData ? (
                            <div className='text-center py-10 text-rose-600 dark:text-rose-400'>
                                <Icons.warning size={40} className='mx-auto mb-3' />
                                <p className='font-semibold'>Không thể tải bản nháp hợp đồng</p>
                                <p className='text-xs mt-1'>Vui lòng thử lại sau hoặc liên hệ hỗ trợ.</p>
                            </div>
                        ) : (
                            <div className='bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-lg shadow-sm border font-serif max-w-[900px] mx-auto text-[13px] sm:text-[14px] leading-relaxed text-black dark:text-neutral-100 text-justify'>
                                {/* Quốc hiệu */}
                                <div className='flex flex-col sm:flex-row justify-between gap-4 border-b border-neutral-300 dark:border-neutral-800 pb-4 mb-6 font-sans text-xs'>
                                    <div className='text-center sm:text-left'>
                                        <div className='font-bold text-neutral-900 dark:text-neutral-100'>HỆ THỐNG KẾT NỐI GIA SƯ TUTORNET</div>
                                        <div className='italic text-neutral-500'>Website: www.tutornet.vn</div>
                                    </div>
                                    <div className='text-center sm:text-right'>
                                        <div className='font-bold text-neutral-900 dark:text-neutral-100 text-center'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                        <div className='font-bold text-neutral-900 dark:text-neutral-100 text-center'>Độc lập - Tự do - Hạnh phúc</div>
                                        <div className='italic text-neutral-500 mt-1 text-center'>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                                    </div>
                                </div>

                                {/* Tiêu đề chính */}
                                <div className='text-center mb-6 font-sans'>
                                    <h1 className='text-lg sm:text-xl font-bold tracking-wide uppercase text-neutral-900 dark:text-neutral-50'>HỢP ĐỒNG DỊCH VỤ VÀ GIAO NHẬN LỚP HỌC</h1>
                                    <h2 className='text-sm font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 mt-1 uppercase'>(MÔ HÌNH HỢP ĐỒNG BA BÊN ĐIỆN TỬ)</h2>
                                </div>

                                {/* Căn cứ pháp lý */}
                                <div className='space-y-1 text-neutral-600 dark:text-neutral-400 italic mb-6 text-xs sm:text-sm'>
                                    <p>Căn cứ Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam số 91/2015/QH13 ngày 24/11/2015;</p>
                                    <p>Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023;</p>
                                    <p>Căn cứ Điều khoản và Điều kiện sử dụng dịch vụ của Nền tảng kết nối gia sư TutorNet có hiệu lực từ ngày 01/12/2024;</p>
                                    <p>Dựa trên sự thỏa thuận tự nguyện, bình đẳng và thiện chí của các Bên dưới đây:</p>
                                </div>

                                {/* PHẦN I */}
                                <div className='space-y-4 mb-6'>
                                    <h3 className='font-sans font-bold text-sm uppercase border-b pb-1 text-neutral-900 dark:text-neutral-200'>PHẦN I: THÔNG TIN CÁC BÊN THAM GIA</h3>

                                    <div className='space-y-1.5'>
                                        <p className='font-bold'>1. BÊN CUNG CẤP DỊCH VỤ / NỀN TẢNG (BÊN A): HỆ THỐNG GIA SƯ TUTORNET</p>
                                        <div className='pl-4 text-neutral-700 dark:text-neutral-300'>
                                            <div>• Đại diện bởi: Ban Quản Trị Hệ Thống TutorNet</div>
                                            <div>• Hotline hỗ trợ: 0999.XXX.XXX</div>
                                            <div>• Vai trò: Đơn vị trung gian công nghệ cung cấp thông tin, điều phối, bảo hộ giao dịch và hỗ trợ giải quyết tranh chấp.</div>
                                        </div>
                                    </div>

                                    <div className='space-y-1.5'>
                                        <p className='font-bold'>2. KHÁCH HÀNG / GIA SƯ (BÊN B):</p>
                                        <div className='pl-4 text-neutral-700 dark:text-neutral-300'>
                                            <div>• Họ và tên gia sư: <span className='font-bold uppercase'>{previewData.tutorName}</span></div>
                                            <div>• Năm sinh: {previewData.tutorBirthYear}</div>
                                            <div>• Số điện thoại liên hệ: {previewData.tutorPhone}</div>
                                            <div>• Email hệ thống: {previewData.tutorEmail}</div>
                                        </div>
                                    </div>

                                    <div className='space-y-1.5'>
                                        <p className='font-bold'>3. PHỤ HUYNH / HỌC SINH (BÊN C):</p>
                                        <div className='pl-4 text-neutral-700 dark:text-neutral-300'>
                                            <div>• Họ và tên người đại diện: <span className='font-bold uppercase'>{previewData.studentName} (PHỤ HUYNH)</span></div>
                                            <div>• Số điện thoại liên hệ: <span className='italic text-neutral-500'>{previewData.studentPhone} (Sẽ được mở khóa sau khi ký nhận)</span></div>
                                            <div>• Email nhận thông báo: <span className='italic text-neutral-500'>{previewData.studentEmail} (Sẽ được mở khóa sau khi ký nhận)</span></div>
                                            <div>• Địa chỉ giảng dạy: <span className='italic text-neutral-500'>{previewData.studentAddress}</span></div>
                                        </div>
                                    </div>
                                </div>

                                {/* PHẦN II */}
                                <div className='space-y-4 mb-6'>
                                    <h3 className='font-sans font-bold text-sm uppercase border-b pb-1 text-neutral-900 dark:text-neutral-200'>PHẦN II: CÁC ĐIỀU KHOẢN VÀ ĐIỀU KIỆN CHUNG</h3>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 1: Thông tin lớp học và Thỏa thuận giảng dạy</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>Bên A tiến hành điều phối và bàn giao thông tin lớp học theo yêu cầu của Bên C cho Bên B thực hiện công tác giảng dạy với các chi tiết cụ thể như sau:</p>

                                        <div className='overflow-x-auto my-3 font-sans text-xs'>
                                            <table className='w-full border-collapse border border-neutral-300 dark:border-neutral-800 text-left'>
                                                <tbody>
                                                    <tr>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold w-1/4'>Mã lớp học</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2 font-bold text-primary'>{previewData.classCode}</td>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold w-1/4'>Môn học & Lớp</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2'>{previewData.subjectName} - {previewData.gradeLevel}</td>
                                                    </tr>
                                                    <tr>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold'>Học phí thỏa thuận</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2 font-bold'>{previewData.tuitionRate.toLocaleString('vi-VN')} VND / giờ</td>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold'>Dạy thử miễn phí</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2'>01 buổi đầu tiên (Thời lượng: 60 - 90 phút)</td>
                                                    </tr>
                                                    <tr>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold'>Thời gian học</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2' colSpan={3}>{previewData.scheduleDetail}</td>
                                                    </tr>
                                                    <tr>
                                                        <th className='border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold'>Địa điểm giảng dạy</th>
                                                        <td className='border border-neutral-300 dark:border-neutral-800 p-2' colSpan={3}>{previewData.studentAddress}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 2: Thù lao và Phương thức thanh toán (Giữa Bên B và Bên C)</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>2.1 Mức thù lao giảng dạy (Học phí) được áp dụng cố định theo thỏa thuận tại Điều 1 của Hợp đồng này. Bên B không được tự ý yêu cầu tăng học phí hoặc thay đổi cấu trúc giờ học khi chưa có sự đồng ý bằng văn bản của Bên C và sự chứng kiến của Bên A.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>2.2 Phương thức thanh toán: Học phí sẽ được Bên C thanh toán trực tiếp cho Bên B bằng tiền mặt hoặc chuyển khoản qua tài khoản ngân hàng cá nhân vào cuối mỗi tháng học hoặc theo chu kỳ thỏa thuận riêng giữa Bên B và Bên C.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>2.3 Bên A hoàn toàn không tham gia trực tiếp vào quy trình thu/giữ học phí và không chịu trách nhiệm tài chính đối với việc chậm trễ thanh toán học phí từ Bên C cho Bên B.</p>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 3: Phí giao lớp, Hạn thanh toán và Chính sách hoàn phí (Giữa Bên A và Bên B)</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>3.1 Phí giao lớp (Phí giới thiệu): Bên B có trách nhiệm thanh toán cho Bên A khoản phí môi giới một lần duy nhất trị giá: <span className='font-bold text-neutral-900 dark:text-neutral-50'>{previewData.introductionFee.toLocaleString('vi-VN')} VND</span>.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>3.2 Hạn thanh toán: Chậm nhất là <span className='font-bold'>35 ngày</span> kể từ Ngày Giao Lớp hệ thống ghi nhận.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>3.3 Cơ chế phân bậc phí dựa trên vòng đời thực tế của Lớp học (Bảo hộ rủi ro lớp hỏng):</p>
                                        <div className='pl-4 space-y-1 text-neutral-700 dark:text-neutral-300'>
                                            <div>• <span className='font-bold'>Mức 0% (Không thu phí):</span> Nếu Lớp Học Dừng Lại trong khoảng thời gian từ ngày 1 đến ngày 15 kể từ ngày giao lớp do nguyên nhân khách quan. Bên B hoàn toàn được miễn trừ trách nhiệm đóng phí giới thiệu sau khi Bên A xác minh thông tin thành công.</div>
                                            <div>• <span className='font-bold'>Mức 50%:</span> Nếu Lớp Học Dừng Lại trong khoảng thời gian từ ngày 16 đến ngày 30 kể từ ngày giao lớp.</div>
                                            <div>• <span className='font-bold'>Mức 100%:</span> Nếu Lớp Học diễn ra thành công và ổn định vượt quá 30 ngày kể từ ngày giao lớp.</div>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 4: Quyền và Nghĩa vụ của Bên A (Nền tảng)</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>4.1 Đảm bảo cung cấp đầy đủ, chính xác thông tin lớp học, yêu cầu của học viên cho Bên B.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>4.2 Hệ thống tự động áp dụng cơ chế <span className='italic'>Masking (Che giấu thông tin liên hệ bảo mật)</span> đối với Số điện thoại và Email của Bên C trên giao diện của Bên B cho đến khi Bên B thực hiện lệnh xác nhận ký Hợp đồng này.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>4.3 Tiếp nhận thông tin báo hỏng lớp, tiến hành hậu kiểm độc lập và xử lý chốt mức phí môi giới công bằng theo quy định tại Điều 3.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>4.4 Miễn trừ trách nhiệm: Bên A không chịu trách nhiệm về chất lượng giảng dạy thực tế của Bên B, tác phong hành vi dân sự bên ngoài ứng dụng của các bên, cũng như không can thiệp vào các tranh chấp phát sinh nằm ngoài phạm vi điều khoản giao dịch này.</p>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 5: Quyền và Nghĩa vụ của Bên B (Gia sư)</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>5.1 Ngay sau khi ký hợp đồng trực tuyến và nhận được thông tin liên hệ của Bên C, Bên B phải chủ động gọi điện trao đổi, hẹn lịch buổi dạy thử miễn phí trước với Bên C trong vòng 24 giờ.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>5.2 Tuân thủ tuyệt đối quy định dạy thử 01 buổi đầu tiên miễn phí, chuẩn bị giáo án nghiêm túc, đúng trình độ và lớp học yêu cầu.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>5.3 <span className='font-bold'>Quy định nghiêm ngặt về bảo mật thông tin:</span> Tuyệt đối không cung cấp, chuyển nhượng thông tin lớp học này cho bất kỳ bên thứ ba nào dưới mọi hình thức. Tuyệt đối không trao đổi, thảo luận hoặc truyền đạt bất kỳ nội dung nào liên quan đến "Phí giao lớp" hoặc chiết khấu hệ thống với Bên C. Vi phạm sẽ bị khóa tài khoản vĩnh viễn.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>5.4 Đảm bảo tác phong sư phạm, dạy đúng giờ. Trường hợp bận bất khả kháng nghỉ dạy phải thông báo trước ít nhất 3 giờ và dạy bù phù hợp.</p>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 6: Quyền và Nghĩa vụ của Bên C (Phụ huynh / Học sinh)</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>6.1 Đôn đốc, nhắc nhở con em tham gia học tập đúng giờ, chuẩn bị không gian học tập đủ ánh sáng, yên tĩnh.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>6.2 Thanh toán học phí cho Bên B đầy đủ, đúng thời hạn như đã cam kết tại Điều 2.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>6.3 Được quyền yêu cầu Bên A hỗ trợ đổi gia sư khác hoàn toàn miễn phí hoặc yêu cầu dừng lớp học nếu xét thấy gia sư dạy không đạt hiệu quả.</p>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 7: Chế tài vi phạm và Biện pháp xử lý bùng phí</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>7.1 Trường hợp Bên B tiếp tục duy trì việc giảng dạy thực tế tại nhà Bên C nhưng cố tình trốn tránh, quá hạn 35 ngày không hoàn thành nghĩa vụ nộp phí giao lớp cho Bên A, hệ thống sẽ tự động kích hoạt các chế tài nghiêm khắc:</p>
                                        <div className='pl-4 space-y-1 text-neutral-700 dark:text-neutral-300'>
                                            <div>• Đình chỉ lập tức quyền truy cập tài khoản, chuyển trạng thái hồ sơ thành <span className='font-bold'>VIOLATED/SUSPENDED</span> và đưa vào Danh sách đen.</div>
                                            <div>• Bên A có quyền gửi văn bản thông báo miễn trừ trách nhiệm đến Bên C, nêu rõ hành vi vi phạm hợp đồng của gia sư.</div>
                                            <div>• Tùy theo mức độ thiệt hại, Bên A bảo lưu quyền khởi kiện Bên B ra cơ quan Công an có thẩm quyền về tội "Lạm dụng tín nhiệm chiếm đoạt tài sản" theo Điều 140 Bộ luật Hình sự.</div>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='font-bold'>Điều 8: Giải quyết tranh chấp và Hiệu lực hợp đồng</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>8.1 Hợp đồng này được lập dưới dạng hợp đồng điện tử dựa trên hành vi xác thực số. Các Bên cam kết thực hiện đầy đủ các điều khoản.</p>
                                        <p className='text-neutral-700 dark:text-neutral-300'>8.2 Hợp đồng có hiệu lực pháp lý kể từ thời điểm hệ thống ghi nhận hành vi bấm nút "Xác nhận đồng ý ký hợp đồng trực tuyến" thành công từ Bên B.</p>
                                    </div>
                                </div>

                                {/* CLICKWRAP EVIDENCE BOX */}
                                <div className='border border-dashed border-primary/40 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg my-6 font-sans text-xs space-y-1.5'>
                                    <div className='font-bold uppercase text-primary/95 text-[11px] border-b pb-1 mb-2 tracking-wide'>
                                        THÔNG TIN XÁC THỰC CHỨNG CỨ KÝ ĐIỆN TỬ (CLICKWRAP EVIDENCE BOX)
                                    </div>
                                    <div>• <span className='font-bold'>Trạng thái giao dịch:</span> <span className='font-semibold text-amber-600'>BẢN NHÁP CHỜ KÝ CHỨNG THỰC (PENDING SIGNATURE)</span></div>
                                    <div>• <span className='font-bold'>Địa chỉ IP thực thi:</span> <span className='text-neutral-500'>[Hệ thống sẽ ghi nhận IP của bạn khi bấm Ký]</span></div>
                                    <div>• <span className='font-bold'>Mã băm dữ liệu (Hash ID):</span> <span className='text-neutral-500'>[Sẽ tự động băm sinh mã Hash an toàn sau khi tạo file PDF]</span></div>
                                    <div>• <span className='font-bold'>Thời gian ghi nhận hệ thống (Timestamp):</span> <span className='text-neutral-500'>[Thời gian thực tế lúc bấm Ký số]</span></div>
                                    <p className='italic text-neutral-500 mt-2 text-[10px]'>
                                        * Ghi chú: Văn bản này được lưu trữ dưới dạng điện tử bảo mật trên máy chủ TutorNet. Bản sao hợp pháp sẽ được tự động biên dịch sang định dạng PDF bất biến và gửi đồng thời đến hòm thư Email đăng ký của Phụ huynh và Gia sư để làm căn cứ pháp lý đối soát chéo.
                                    </p>
                                </div>

                                {/* Bảng chữ ký ba bên */}
                                <div className='grid grid-cols-3 gap-4 text-center font-sans text-xs sm:text-sm pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6'>
                                    <div>
                                        <div className='font-bold'>ĐẠI DIỆN BÊN A</div>
                                        <div className='text-neutral-500 text-[10px] italic mt-1'>(Đã ký điện tử)</div>
                                        <div className='font-bold mt-12 text-neutral-800 dark:text-neutral-300'>TutorNet Ban Quản Trị</div>
                                    </div>
                                    <div>
                                        <div className='font-bold'>ĐẠI DIỆN BÊN B</div>
                                        <div className='text-neutral-500 text-[10px] italic mt-1'>(Xác thực qua tài khoản)</div>
                                        <div className='font-bold mt-12 text-neutral-800 dark:text-neutral-300 uppercase'>{previewData.tutorName}</div>
                                    </div>
                                    <div>
                                        <div className='font-bold'>ĐẠI DIỆN BÊN C</div>
                                        <div className='text-neutral-500 text-[10px] italic mt-1'>(Xác thực qua yêu cầu)</div>
                                        <div className='font-bold mt-12 text-neutral-800 dark:text-neutral-300 uppercase'>{previewData.studentName}</div>
                                    </div>
                                </div>

                                <div className='text-center text-[10px] italic text-neutral-400 mt-8 border-t pt-2 font-sans'>
                                    Hợp đồng điện tử ba bên có hiệu lực kể từ thời điểm ký. Mọi thay đổi phải được sự đồng thuận và lưu trữ trên hệ thống.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dialog Footer */}
                    <DialogFooter className='px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl'>
                        <div className='flex items-start gap-2.5 max-w-lg text-left'>
                            <input
                                type='checkbox'
                                id='isAgreedContract'
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className='h-4 w-4 shrink-0 rounded border-neutral-300 text-primary focus:ring-primary mt-0.5 cursor-pointer dark:border-neutral-700'
                                disabled={loadingPreview || !previewData}
                            />
                            <label
                                htmlFor='isAgreedContract'
                                className='text-xs font-medium text-muted-foreground leading-tight cursor-pointer select-none hover:text-foreground transition-colors'
                            >
                                Tôi đã đọc, hiểu và cam kết tuân thủ các điều khoản hợp đồng điện tử ba bên nêu trên.
                            </label>
                        </div>

                        <div className='flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end'>
                            <Button
                                variant='outline'
                                className='h-9 px-4 cursor-pointer text-xs'
                                onClick={() => setContractPreviewInvite(null)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                className='h-9 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer text-xs'
                                disabled={!isAgreed || acceptingId !== null || loadingPreview || !previewData}
                                onClick={handleConfirmSign}
                            >
                                {acceptingId !== null ? (
                                    <>
                                        <Icons.spinner size={13} className='animate-spin' />
                                        Đang ký nhận...
                                    </>
                                ) : (
                                    <>
                                        <Icons.circleCheck size={14} />
                                        Xác nhận Ký & Nhận lớp
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </>
    );
}
