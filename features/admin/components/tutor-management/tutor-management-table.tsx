'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
    adminTutorsQueryOptions,
    adminTutorStatsQueryOptions,
    adminTutorFilterOptionsQueryOptions,
    adminTutorStatusesQueryOptions,
    adminTutorByIdOptions
} from '../../api/queries';
import { approveTutorProfile, rejectTutorProfile } from '../../api/service';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { TutorCvModal } from '@/features/tutors/components/tutor-cv-modal';
import { type TutorApplicant, type TutorStatus } from './tutor-data';
import { ApproveDialog } from './approve-dialog';
import { RejectDialog } from './reject-dialog';

const SUBJECT_NAME_TO_ID: Record<string, number> = {
    'Toán': 1, 'Toán học': 1, 'Vật Lý': 4, 'Vật lý': 4, 'Hóa Học': 5, 'Hoá học': 5,
    'Sinh Học': 6, 'Sinh học': 6, 'Ngữ Văn': 2, 'Văn': 2, 'Ngữ văn': 2,
    'Lịch Sử': 7, 'Lịch sử': 7, 'Địa Lý': 8, 'Địa lý': 8,
    'Tiếng Anh': 3, 'Tiếng Nhật': 11, 'Tiếng Trung': 12, 'Tiếng Hàn': 13,
    'Lập trình': 10, 'Tin Học': 9, 'Tin học': 9, 'Guitar': 14, 'Âm nhạc': 14,
    'Mỹ thuật': 15, 'Thể dục - Thể thao': 16
};

const EDU_LEVEL_MAP: Record<string, string> = {
    'HIGH_SCHOOL': 'Tốt nghiệp THPT',
    'ASSOCIATE': 'Cao đẳng',
    'BACHELOR': 'Đại học',
    'MASTER': 'Thạc sĩ',
    'PHD': 'Tiến sĩ',
    'OTHER': 'Khác',
};

function mapBackendTutor(t: any): TutorApplicant {
    return {
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone || '',
        avatar: t.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + t.fullName,
        subjects: t.subjectNames || [],
        education: EDU_LEVEL_MAP[t.educationLevel] || t.educationLevel || 'Khác',
        university: t.university || 'Đại học',
        experience: String(t.experienceYears || 0),
        appliedAt: t.createdAt,
        status: t.status === 'PENDING_REVIEW' ? 'PENDING' : t.status,
        cvUrl: `/admin/tutors/${t.id}/cv`,
        rating: t.ratingAvg || 0,
        location: t.province || 'Hà Nội',
    };
}

/* ─── Types ─── */
type StatusFilter = 'ALL' | TutorStatus;

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/* ─── StatusBadge ─── */
function StatusBadge({ status }: { status: TutorStatus }) {
    if (status === 'DRAFT') return (
        <Badge variant='outline' className='border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-700 gap-1'>
            <Icons.edit size={11} />
            Nháp
        </Badge>
    );
    if (status === 'PENDING') return (
        <Badge variant='outline' className='border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 gap-1'>
            <span className='h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse' />
            Chờ duyệt
        </Badge>
    );
    if (status === 'APPROVED') return (
        <Badge variant='outline' className='border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 gap-1'>
            <Icons.circleCheck size={11} />
            Đã duyệt
        </Badge>
    );
    if (status === 'SUSPENDED') return (
        <Badge variant='outline' className='border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700 gap-1'>
            <Icons.alertCircle size={11} />
            Tạm dừng
        </Badge>
    );
    return (
        <Badge variant='outline' className='border-red-300 text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700 gap-1'>
            <Icons.circleX size={11} />
            Từ chối
        </Badge>
    );
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── FacetedFilter (styled same as admin table toolbar) ─── */
interface FacetedFilterProps {
    title: string;
    options: { value: string; label: string }[];
    selected: Set<string>;
    onToggle: (value: string) => void;
    onClear: () => void;
    multiple?: boolean;
}
function FacetedFilter({ title, options, selected, onToggle, onClear, multiple = true }: FacetedFilterProps) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size='sm' className='border-dashed h-8'>
                    {selected.size > 0 ? (
                        <span
                            role='button'
                            onClick={e => { e.stopPropagation(); onClear(); }}
                            className='rounded-sm opacity-70 hover:opacity-100 cursor-pointer p-0.5 inline-flex items-center justify-center mr-1'
                        >
                            <Icons.xCircle className='h-3.5 w-3.5' />
                        </span>
                    ) : (
                        <Icons.plusCircle className='mr-1.5 h-3.5 w-3.5' />
                    )}
                    {title}
                    {selected.size > 0 && (
                        <>
                            <Separator orientation='vertical' className='mx-1 data-[orientation=vertical]:h-4' />
                            <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
                                {selected.size}
                            </Badge>
                            <div className='hidden items-center gap-1 lg:flex'>
                                {selected.size > 2 ? (
                                    <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                                        {selected.size} đã chọn
                                    </Badge>
                                ) : (
                                    options.filter(o => selected.has(o.value)).map(o => (
                                        <Badge key={o.value} variant='secondary' className='rounded-sm px-1 font-normal'>
                                            {o.label}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-48 p-0' align='start'>
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>Không có kết quả.</CommandEmpty>
                        <CommandGroup className='max-h-[300px] overflow-y-auto'>
                            {options.map(option => {
                                const isSelected = selected.has(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            onToggle(option.value);
                                            if (!multiple) setOpen(false);
                                        }}
                                    >
                                        <div className={`border-primary flex size-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'}`}>
                                            <CheckIcon />
                                        </div>
                                        <span className='truncate'>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selected.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem onSelect={onClear} className='justify-center text-center'>
                                        Xóa bộ lọc
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function TutorManagementTable() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(() => {
        return searchParams.get('keyword') || '';
    });

    const debouncedSearch = useDebounce(search, 500);

    // Selection
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Dialogs
    const [viewingTutorId, setViewingTutorId] = useState<number | null>(null);
    const [approveTutors, setApproveTutors] = useState<TutorApplicant[]>([]);
    const [rejectTutors, setRejectTutors] = useState<TutorApplicant[]>([]);

    /* ─── Fetch Dynamic Data ─── */
    // Fetch subjects tree (optional fallback)
    const { data: subjectsTree } = useQuery({
        queryKey: ['subjects-tree'],
        queryFn: async () => {
            const res = await apiClient<any>('/subjects/tree');
            return res?.data || res || [];
        }
    });

    // Fetch dynamic stats, filter-options, statuses
    const { data: statsData, refetch: refetchStats } = useQuery(adminTutorStatsQueryOptions());
    const { data: filterOptionsData } = useQuery(adminTutorFilterOptionsQueryOptions());
    const { data: statusesData } = useQuery(adminTutorStatusesQueryOptions());

    // Fetch dynamic tutor details for CV viewing
    const { data: tutorDetail, isPending: isLoadingDetail } = useQuery(
        adminTutorByIdOptions(viewingTutorId ?? 0)
    );

    // Build statusOptions dynamically
    const statusOptions = useMemo(() => {
        const rawStatuses = statusesData || filterOptionsData?.statuses || [
            { value: 'DRAFT', label: 'Nháp' },
            { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
            { value: 'APPROVED', label: 'Đã duyệt' },
            { value: 'REJECTED', label: 'Đã từ chối' },
            { value: 'SUSPENDED', label: 'Tạm dừng' }
        ];
        return rawStatuses.map((s: any) => ({
            value: s.value === 'PENDING_REVIEW' ? 'PENDING' : s.value,
            label: s.label
        }));
    }, [statusesData, filterOptionsData]);

    const allSubjects = useMemo(() => {
        const subjectsList = filterOptionsData?.subjects || [];
        if (subjectsList.length === 0) {
            // fallback if empty
            if (!subjectsTree || !Array.isArray(subjectsTree)) {
                return ['Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'Tiếng Anh', 'Lịch Sử', 'Địa Lý', 'Tin Học', 'GDCD'].map(s => ({ value: s, label: s }));
            }
            const list: { value: string; label: string }[] = [];
            subjectsTree.forEach((parent: any) => {
                if (parent.children && Array.isArray(parent.children)) {
                    parent.children.forEach((child: any) => {
                        list.push({ value: child.name, label: child.name });
                    });
                }
            });
            return list;
        }
        return subjectsList.map((s: any) => ({ value: s.name, label: s.name }));
    }, [filterOptionsData, subjectsTree]);

    const SUBJECT_NAME_TO_ID_MAP = useMemo(() => {
        const map: Record<string, number> = { ...SUBJECT_NAME_TO_ID };
        const subjectsList = filterOptionsData?.subjects || [];
        subjectsList.forEach((s: any) => {
            map[s.name] = s.id;
        });
        return map;
    }, [filterOptionsData]);

    const SUBJECT_ID_TO_NAME_MAP = useMemo(() => {
        const map: Record<number, string> = {};
        Object.entries(SUBJECT_NAME_TO_ID_MAP).forEach(([name, id]) => {
            map[id] = name;
        });
        return map;
    }, [SUBJECT_NAME_TO_ID_MAP]);

    // URL Derived states (SSOT)
    const statusSelected = useMemo(() => {
        const vals = searchParams.getAll('statuses');
        const mapped = vals.map(v => v === 'PENDING_REVIEW' ? 'PENDING' : v);
        return new Set(mapped);
    }, [searchParams]);

    const subjectSelected = useMemo(() => {
        const ids = searchParams.getAll('subjectIds').map(Number);
        const names = ids
            .map(id => SUBJECT_ID_TO_NAME_MAP[id] || null)
            .filter(Boolean) as string[];
        return new Set(names);
    }, [searchParams, SUBJECT_ID_TO_NAME_MAP]);

    const page = useMemo(() => {
        const urlPage = searchParams.get('page');
        const num = urlPage ? Number(urlPage) : 1;
        return isNaN(num) || num < 1 ? 1 : num;
    }, [searchParams]);

    const pageSize = useMemo(() => {
        const urlLimit = searchParams.get('limit');
        return urlLimit ? Number(urlLimit) : 10;
    }, [searchParams]);

    const subjectIds = useMemo(() => {
        if (subjectSelected.size === 0) return undefined;
        return Array.from(subjectSelected)
            .map(name => SUBJECT_NAME_TO_ID_MAP[name])
            .filter(Boolean) as number[];
    }, [subjectSelected, SUBJECT_NAME_TO_ID_MAP]);

    // Helper to update query string parameters
    const updateQuery = (updates: Record<string, string[] | string | number | null | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.delete(key);
                value.forEach(val => {
                    params.append(key, String(val));
                });
            } else {
                params.set(key, String(value));
            }
        });

        const newQueryString = params.toString();
        const currentQueryString = searchParams.toString();

        if (newQueryString !== currentQueryString) {
            router.replace(`${pathname}?${newQueryString}`, { scroll: false });
        }
    };

    const lastPushedKeywordRef = useRef<string | null>(null);

    // Sync search input to URL on debouncing
    useEffect(() => {
        const urlKeyword = searchParams.get('keyword') || '';
        if (debouncedSearch !== urlKeyword) {
            lastPushedKeywordRef.current = debouncedSearch;
            updateQuery({
                keyword: debouncedSearch || null,
                page: 1
            });
        }
    }, [debouncedSearch]);

    // Sync URL change back to search input (history navigation)
    useEffect(() => {
        const urlKeyword = searchParams.get('keyword') || '';
        if (urlKeyword !== lastPushedKeywordRef.current) {
            setSearch(urlKeyword);
            lastPushedKeywordRef.current = urlKeyword;
        }
    }, [searchParams]);

    const filters = useMemo(() => ({
        page,
        limit: pageSize,
        keyword: debouncedSearch || undefined,
        statuses: statusSelected.size > 0 ? Array.from(statusSelected) : undefined,
        subjectIds,
        sortBy: 'createdAt',
        sortDir: 'desc'
    }), [page, pageSize, debouncedSearch, statusSelected, subjectIds]);

    const { data: queryData, isPending, refetch } = useQuery(adminTutorsQueryOptions(filters));

    /* ─── Derived ─── */
    const tutorsList = useMemo(() => {
        const content = queryData?.data?.content || [];
        return content.map(mapBackendTutor);
    }, [queryData]);

    const totalElements = queryData?.data?.totalElements || 0;
    const pageCount = queryData?.data?.totalPages || 1;
    const safePage = Math.min(page, pageCount);

    const isFiltered = search !== '' || statusSelected.size > 0 || subjectSelected.size > 0;

    const pendingPaged = tutorsList.filter(t => t.status === 'PENDING');
    const allPendingSelected = pendingPaged.length > 0 && pendingPaged.every(t => selected.has(t.id));
    const somePendingSelected = pendingPaged.some(t => selected.has(t.id)) && !allPendingSelected;

    const selectedPending = tutorsList.filter(t => selected.has(t.id) && t.status === 'PENDING');

    const stats = useMemo(() => {
        const data = statsData || { total: 0, pendingReview: 0, approved: 0, rejected: 0 };
        return {
            total: data.total,
            pending: data.pendingReview,
            approved: data.approved,
            rejected: data.rejected
        };
    }, [statsData]);

    const handleStatusToggle = (value: string) => {
        const next = new Set(statusSelected);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        const statuses = Array.from(next).map(status => status === 'PENDING' ? 'PENDING_REVIEW' : status);
        updateQuery({
            statuses,
            page: 1
        });
    };

    const handleStatusClear = () => {
        updateQuery({
            statuses: [],
            page: 1
        });
    };

    const handleSubjectToggle = (value: string) => {
        const next = new Set(subjectSelected);
        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }
        const subjectIds = Array.from(next)
            .map(name => SUBJECT_NAME_TO_ID_MAP[name])
            .filter(Boolean) as number[];
        updateQuery({
            subjectIds: subjectIds.map(String),
            page: 1
        });
    };

    const handleSubjectClear = () => {
        updateQuery({
            subjectIds: [],
            page: 1
        });
    };

    const resetFilters = () => {
        setSearch('');
        updateQuery({
            keyword: null,
            statuses: [],
            subjectIds: [],
            page: 1
        });
    };

    const toggleSelect = (id: number) =>
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

    const toggleSelectAll = () => {
        if (allPendingSelected) {
            setSelected(prev => { const s = new Set(prev); pendingPaged.forEach(t => s.delete(t.id)); return s; });
        } else {
            setSelected(prev => { const s = new Set(prev); pendingPaged.forEach(t => s.add(t.id)); return s; });
        }
    };

    const handleApproveConfirm = async (ids: number[]) => {
        try {
            await Promise.all(ids.map(id => approveTutorProfile(id)));
            setSelected(new Set());
            refetch();
            refetchStats();
            toast.success(`Đã duyệt ${ids.length} gia sư thành công`);
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi duyệt hồ sơ');
        }
    };

    const handleRejectConfirm = async (ids: number[], reason: string, noteText: string) => {
        try {
            const combinedReason = noteText ? `${reason}: ${noteText}` : reason;
            await Promise.all(ids.map(id => rejectTutorProfile(id, combinedReason)));
            setSelected(new Set());
            refetch();
            refetchStats();
            toast.success(`Đã từ chối ${ids.length} gia sư`, { description: reason });
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi từ chối hồ sơ');
        }
    };

    /* ─── Pagination helper ─── */
    const goTo = (p: number) => {
        const targetPage = Math.max(1, Math.min(p, pageCount));
        updateQuery({
            page: targetPage
        });
    };

    return (
        <TooltipProvider>
            <div className='space-y-4'>
                {/* Stats */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    {[
                        { label: 'Tổng gia sư', value: stats.total, icon: <Icons.users size={16} className='text-primary' />, color: 'bg-primary/10' },
                        { label: 'Chờ duyệt', value: stats.pending, icon: <Icons.clock size={16} className='text-amber-600' />, color: 'bg-amber-50 dark:bg-amber-950/30' },
                        { label: 'Đã duyệt', value: stats.approved, icon: <Icons.circleCheck size={16} className='text-emerald-600' />, color: 'bg-emerald-50 dark:bg-emerald-950/30' },
                        { label: 'Từ chối', value: stats.rejected, icon: <Icons.circleX size={16} className='text-red-600' />, color: 'bg-red-50 dark:bg-red-950/30' },
                    ].map(s => (
                        <div key={s.label} className='rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3'>
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                                {s.icon}
                            </div>
                            <div>
                                <p className='text-2xl font-bold leading-none'>{s.value}</p>
                                <p className='text-xs text-muted-foreground mt-0.5'>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main table card */}
                <div className='rounded-xl border bg-card shadow-sm space-y-2'>
                    {/* ── Toolbar (giống DataTableToolbar của admin) ── */}
                    <div role='toolbar' className='flex w-full items-start justify-between gap-2 p-2 pb-0'>
                        <div className='flex flex-1 flex-wrap items-center gap-2'>
                            {/* Search */}
                            <div className='relative'>
                                <Icons.search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
                                <Input
                                    placeholder='Tìm theo tên, email, môn học...'
                                    className='pl-9 h-8 w-40 lg:w-56'
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Faceted: Trạng thái */}
                            <FacetedFilter
                                title='Trạng thái'
                                options={statusOptions}
                                selected={statusSelected}
                                onToggle={handleStatusToggle}
                                onClear={handleStatusClear}
                            />

                            {/* Faceted: Môn học */}
                            <FacetedFilter
                                title='Môn học'
                                options={allSubjects}
                                selected={subjectSelected}
                                onToggle={handleSubjectToggle}
                                onClear={handleSubjectClear}
                            />

                            {isFiltered && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='border-dashed h-8'
                                    onClick={resetFilters}
                                >
                                    <Cross2Icon className='mr-1' />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bulk action bar */}
                    {selectedPending.length > 0 && (
                        <div className='flex items-center gap-2 mx-4 p-2 rounded-lg bg-primary/5 border border-primary/20'>
                            <span className='text-sm font-medium text-primary'>
                                Đã chọn {selectedPending.length} gia sư đang chờ duyệt
                            </span>
                            <div className='flex gap-2 ml-auto'>
                                <Button
                                    size='sm'
                                    variant='outline'
                                    className='h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
                                    onClick={() => setRejectTutors(selectedPending)}
                                >
                                    <Icons.circleX size={12} />
                                    Từ chối hàng loạt
                                </Button>
                                <Button
                                    size='sm'
                                    className='h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white'
                                    onClick={() => setApproveTutors(selectedPending)}
                                >
                                    <Icons.circleCheck size={12} />
                                    Duyệt hàng loạt
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className='overflow-x-auto border-t'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b bg-muted/30'>
                                    <th className='w-10 px-4 py-3 text-left'>
                                        <Checkbox
                                            checked={somePendingSelected ? 'indeterminate' : allPendingSelected}
                                            onCheckedChange={toggleSelectAll}
                                            disabled={pendingPaged.length === 0}
                                            aria-label='Chọn tất cả'
                                        />
                                    </th>
                                    <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Gia sư</th>
                                    <th className='px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell'>Môn dạy</th>
                                    <th className='px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell'>Học vấn</th>
                                    <th className='px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell'>Ngày nộp</th>
                                    <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Trạng thái</th>
                                    <th className='px-4 py-3 text-right font-medium text-muted-foreground'>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y'>
                                {isPending ? (
                                    <tr>
                                        <td colSpan={7} className='py-16 text-center text-muted-foreground'>
                                            <Icons.spinner className='mx-auto mb-2 animate-spin h-6 w-6 text-primary' />
                                            <p className='text-sm'>Đang tải dữ liệu...</p>
                                        </td>
                                    </tr>
                                ) : tutorsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='py-16 text-center text-muted-foreground'>
                                            <Icons.search size={32} className='mx-auto mb-2 opacity-30' />
                                            <p className='text-sm'>Không tìm thấy kết quả phù hợp</p>
                                        </td>
                                    </tr>
                                ) : tutorsList.map(tutor => (
                                    <tr
                                        key={tutor.id}
                                        className={`group transition-colors hover:bg-muted/30 ${selected.has(tutor.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className='px-4 py-3'>
                                            <Checkbox
                                                checked={selected.has(tutor.id)}
                                                onCheckedChange={() => toggleSelect(tutor.id)}
                                                disabled={tutor.status !== 'PENDING'}
                                                aria-label={`Chọn ${tutor.fullName}`}
                                            />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='flex items-center gap-3'>
                                                <Avatar className='h-9 w-9 shrink-0'>
                                                    <AvatarImage src={tutor.avatar} alt={tutor.fullName} />
                                                    <AvatarFallback>{tutor.fullName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className='font-semibold leading-tight'>{tutor.fullName}</p>
                                                    <p className='text-xs text-muted-foreground mt-0.5'>{tutor.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-4 py-3 hidden md:table-cell'>
                                            <div className='flex flex-wrap gap-1'>
                                                {tutor.subjects.map(s => (
                                                    <Badge key={s} variant='secondary' className='text-xs px-1.5 py-0'>{s}</Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className='px-4 py-3 hidden lg:table-cell'>
                                            <p className='text-sm'>{tutor.education}</p>
                                            <p className='text-xs text-muted-foreground'>{tutor.experience} năm KN</p>
                                        </td>
                                        <td className='px-4 py-3 hidden xl:table-cell'>
                                            <p className='text-xs text-muted-foreground'>{formatDate(tutor.appliedAt)}</p>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <StatusBadge status={tutor.status} />
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='flex items-center justify-end gap-1'>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size='icon'
                                                            variant='ghost'
                                                            className='h-8 w-8'
                                                            onClick={() => setViewingTutorId(tutor.id)}
                                                        >
                                                            <Icons.cv size={15} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Xem CV</TooltipContent>
                                                </Tooltip>

                                                {tutor.status === 'PENDING' && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size='icon'
                                                                    variant='ghost'
                                                                    className='h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950'
                                                                    onClick={() => setApproveTutors([tutor])}
                                                                >
                                                                    <Icons.circleCheck size={15} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Duyệt</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size='icon'
                                                                    variant='ghost'
                                                                    className='h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950'
                                                                    onClick={() => setRejectTutors([tutor])}
                                                                >
                                                                    <Icons.circleX size={15} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Từ chối</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination (giống DataTablePagination của admin) ── */}
                    <div className='flex w-full flex-wrap items-center justify-between gap-2 overflow-auto px-4 py-3 border-t sm:gap-8'>
                        <div className='text-muted-foreground text-sm whitespace-nowrap'>
                            {totalElements} kết quả
                        </div>
                        <div className='flex items-center gap-2 sm:gap-6 lg:gap-8'>
                            {/* Rows per page */}
                            <div className='hidden items-center space-x-2 sm:flex'>
                                <p className='text-sm font-medium whitespace-nowrap'>Mỗi trang</p>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={v => updateQuery({ limit: Number(v), page: 1 })}
                                >
                                    <SelectTrigger className='h-8 w-[4.5rem]'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent side='top'>
                                        {PAGE_SIZE_OPTIONS.map(n => (
                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page input */}
                            <div className='flex items-center justify-center text-sm font-medium whitespace-nowrap gap-2'>
                                <span className='hidden sm:inline'>Trang</span>
                                <input
                                    aria-label='Đến trang'
                                    type='number'
                                    min={1}
                                    max={pageCount}
                                    value={safePage}
                                    onChange={e => goTo(Number(e.target.value))}
                                    className='w-14 rounded-md border px-2 py-1 text-center text-sm bg-background'
                                />
                                <span className='text-sm hidden sm:inline'>/ {pageCount}</span>
                            </div>

                            {/* Nav buttons */}
                            <div className='flex items-center space-x-1'>
                                <Button
                                    aria-label='Trang đầu'
                                    variant='outline'
                                    size='icon'
                                    className='hidden size-8 lg:flex'
                                    onClick={() => goTo(1)}
                                    disabled={safePage <= 1}
                                >
                                    <Icons.chevronsLeft className='h-4 w-4' />
                                </Button>
                                <Button
                                    aria-label='Trang trước'
                                    variant='outline'
                                    size='icon'
                                    className='size-8'
                                    onClick={() => goTo(safePage - 1)}
                                    disabled={safePage <= 1}
                                >
                                    <Icons.chevronLeft className='h-4 w-4' />
                                </Button>
                                <Button
                                    aria-label='Trang sau'
                                    variant='outline'
                                    size='icon'
                                    className='size-8'
                                    onClick={() => goTo(safePage + 1)}
                                    disabled={safePage >= pageCount}
                                >
                                    <Icons.chevronRight className='h-4 w-4' />
                                </Button>
                                <Button
                                    aria-label='Trang cuối'
                                    variant='outline'
                                    size='icon'
                                    className='hidden size-8 lg:flex'
                                    onClick={() => goTo(pageCount)}
                                    disabled={safePage >= pageCount}
                                >
                                    <Icons.chevronsRight className='h-4 w-4' />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CV Modal (dùng TutorCvModal có sẵn) ── */}
            <TutorCvModal
                tutor={null}
                tutorDetail={tutorDetail}
                open={!!viewingTutorId}
                onClose={() => setViewingTutorId(null)}
                isLoading={isLoadingDetail}
            />

            {/* ── Approve / Reject dialogs ── */}
            <ApproveDialog
                tutors={approveTutors}
                open={approveTutors.length > 0}
                onOpenChange={open => !open && setApproveTutors([])}
                onConfirm={handleApproveConfirm}
            />
            <RejectDialog
                tutors={rejectTutors}
                open={rejectTutors.length > 0}
                onOpenChange={open => !open && setRejectTutors([])}
                onConfirm={handleRejectConfirm}
            />
        </TooltipProvider>
    );
}
