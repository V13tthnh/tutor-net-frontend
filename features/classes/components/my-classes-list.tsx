'use client';

import { useState, useMemo, Fragment, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getClientSecurityFlags } from '@/features/security-sandbox/components/interceptor';
import { useDebounce } from '@/hooks/use-debounce';
import { myClassRequestsQueryOptions, classApplicationsQueryOptions } from '../api/queries';
import type { ClassApplicationResponse, ClassRequestOwnFilters } from '../api/types';
import { acceptApplication } from '../api/service';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn, getAvatarUrl } from '@/lib/utils';
import Link from 'next/link';

// Helper formatting functions
function formatPrice(amount: number) {
  return amount.toLocaleString('vi-VN') + ' đ/tháng';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      icon: React.ComponentType<{ size?: number; className?: string }>;
    }
  > = {
    PENDING: {
      label: 'Chờ duyệt',
      variant: 'outline',
      icon: Icons.clock,
    },
    APPROVED: {
      label: 'Đang tìm gia sư',
      variant: 'default',
      icon: Icons.check,
    },
    MATCHED: {
      label: 'Đã chốt gia sư',
      variant: 'secondary',
      icon: Icons.circleCheck,
    },
    REJECTED: {
      label: 'Từ chối',
      variant: 'destructive',
      icon: Icons.xCircle,
    },
    CANCELLED: {
      label: 'Đã hủy',
      variant: 'outline',
      icon: Icons.close,
    },
  };

  const config = configs[status] || { label: status, variant: 'outline', icon: Icons.help };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 py-1 px-2.5 font-medium border text-xs",
      status === 'APPROVED' && 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500',
      status === 'MATCHED' && 'bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
      status === 'PENDING' && 'bg-amber-50 hover:bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
      status === 'CANCELLED' && 'bg-muted hover:bg-muted text-muted-foreground border-border'
    )}>
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

// ─── Subcomponent: Applicants List ───────────────────────────────────────────
interface ApplicantsListProps {
  classRequestId: number;
  classRequestStatus: string;
  onAcceptSuccess: () => void;
}

function ApplicantsList({ classRequestId, classRequestStatus, onAcceptSuccess }: ApplicantsListProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery(classApplicationsQueryOptions(classRequestId));
  const [selectedApplicant, setSelectedApplicant] = useState<ClassApplicationResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applicants = data?.data || [];

  const handleChooseTutor = (applicant: ClassApplicationResponse) => {
    setSelectedApplicant(applicant);
    setConfirmOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedApplicant) return;
    setIsSubmitting(true);
    try {
      const res = await acceptApplication(classRequestId, selectedApplicant.id);
      toast.success(res.message || 'Đã chốt gia sư thành công!');
      setConfirmOpen(false);
      setSelectedApplicant(null);
      // Invalidate both classes list and current applications query
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      onAcceptSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Có lỗi xảy ra khi chốt gia sư. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 px-6 space-y-4 bg-muted/10 rounded-b-xl border-t">
        <div className="flex items-center gap-2">
          <Icons.spinner className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Đang tải danh sách ứng viên...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-xl p-4 bg-background space-y-2.5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 px-6 text-sm text-destructive bg-rose-50 dark:bg-rose-950/10 rounded-b-xl border-t flex items-center gap-2">
        <Icons.alertCircle size={16} />
        <span>Gặp lỗi khi tải thông tin ứng viên. Vui lòng thử lại sau.</span>
      </div>
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="py-8 px-6 text-center text-sm text-muted-foreground bg-muted/10 rounded-b-xl border-t border-dashed">
        <Icons.info className="mx-auto text-muted-foreground opacity-50 mb-2" size={24} />
        <p className="font-medium">Chưa có ứng viên nào ứng tuyển vào lớp này</p>
        <p className="text-xs text-muted-foreground mt-0.5">Chúng tôi sẽ thông báo cho bạn ngay khi có gia sư đăng ký dạy.</p>
      </div>
    );
  }

  return (
    <div className="py-5 px-6 bg-muted/10 rounded-b-xl border-t space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Icons.users size={14} className="text-primary" />
          Danh sách ứng viên ({applicants.length})
        </h4>
        {classRequestStatus === 'MATCHED' && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Icons.shieldCheck size={13} />
            Đã chốt gia sư thành công
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {applicants.map((app) => {
          const avatarUrl = getAvatarUrl(app.tutorAvatarUrl);
          const isPending = app.status === 'PENDING';
          const isAccepted = app.status === 'ACCEPTED';
          const isRejected = app.status === 'REJECTED';

          return (
            <div
              key={app.id}
              className={cn(
                "border rounded-xl p-4 bg-background shadow-sm flex flex-col justify-between transition-all relative overflow-hidden",
                isAccepted && "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10",
                isRejected && "opacity-60"
              )}
            >
              {/* Top Section: Tutor Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={app.tutorName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {app.tutorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="font-bold text-sm text-foreground truncate">{app.tutorName}</h5>
                      {isAccepted && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 font-bold">
                          Gia sư đã chọn
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          Từ chối
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {app.university} {app.major ? `• ${app.major}` : ''}
                    </p>
                    {app.experienceYears !== null && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Icons.calendar size={10} />
                        Kinh nghiệm: <strong>{app.experienceYears} năm</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Headline */}
                {app.headline && (
                  <p className="text-xs font-semibold text-primary/80 line-clamp-1 italic">
                    &ldquo;{app.headline}&rdquo;
                  </p>
                )}

                {/* Introduction message */}
                {app.message ? (
                  <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs text-muted-foreground leading-relaxed">
                    <p className="line-clamp-4">&ldquo;{app.message}&rdquo;</p>
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground/60">(Không có lời nhắn giới thiệu)</p>
                )}
              </div>

              {/* Bottom Section: Actions */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-4">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Icons.clock size={10} />
                  Ứng tuyển: {formatDate(app.appliedAt)}
                </span>

                {isPending && classRequestStatus === 'APPROVED' && (
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer shadow-sm gap-1"
                    onClick={() => handleChooseTutor(app)}
                  >
                    <Icons.check size={12} />
                    Chốt gia sư
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Icons.warning className="text-amber-500" size={18} />
              Xác nhận chốt gia sư
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Bạn có chắc chắn muốn chọn gia sư <strong>{selectedApplicant?.tutorName}</strong> để dạy lớp học này?
              <br /><br />
              Hệ thống sẽ <strong>tự động từ chối</strong> các hồ sơ ứng tuyển khác và gửi email tạo hợp đồng đến cả hai bên.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-9 text-xs gap-1.5"
              onClick={handleConfirmAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icons.spinner className="h-3 w-3 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Icons.check className="h-3 w-3" />
                  Đồng ý chọn
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component: My Classes List ──────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function MyClassesList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isHtmlInjectionActive, setIsHtmlInjectionActive] = useState(false);

  useEffect(() => {
    const flags = getClientSecurityFlags();
    setIsHtmlInjectionActive(flags.includes('html_injection'));

    // Lắng nghe sự kiện thông báo để reload auth session nếu có trigger từ API
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data === 'auth-session-update') {
        window.dispatchEvent(new CustomEvent('auth-session-update'));
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Local state for search query synced to URL parameter
  const [search, setSearch] = useState(() => searchParams.get('keyword') || '');
  const debouncedSearch = useDebounce(search, 500);

  // Sync local search input with URL search param on back/forward navigation
  const urlKeyword = searchParams.get('keyword') || '';
  const [prevUrlKeyword, setPrevUrlKeyword] = useState(urlKeyword);
  if (urlKeyword !== prevUrlKeyword) {
    setPrevUrlKeyword(urlKeyword);
    setSearch(urlKeyword);
  }

  // Read status, page and limit from URL query parameters
  const activeTab = useMemo(() => {
    const urlStatus = searchParams.get('status');
    return (urlStatus || 'ALL') as 'ALL' | 'PENDING' | 'APPROVED' | 'PROCESSING' | 'MATCHED' | 'REJECTED' | 'CANCELLED';
  }, [searchParams]);

  const page = useMemo(() => {
    const urlPage = searchParams.get('page');
    const num = urlPage ? Number(urlPage) : 1;
    return isNaN(num) || num < 1 ? 1 : num;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const urlLimit = searchParams.get('limit');
    const num = urlLimit ? Number(urlLimit) : 10;
    return isNaN(num) || num < 1 ? 10 : num;
  }, [searchParams]);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // URL query parameter helper
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build API filters matching URL search parameters
  const filters: ClassRequestOwnFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      keyword: debouncedSearch || undefined,
      status: activeTab === 'ALL' ? undefined : activeTab,
      sortBy: 'createdAt',
      sortDir: 'desc',
    }),
    [page, pageSize, debouncedSearch, activeTab]
  );

  // Fetch paginated class requests
  const { data: response, isLoading, isError, refetch } = useQuery(
    myClassRequestsQueryOptions(filters)
  );

  const list = response?.data?.content || [];
  const totalElements = response?.data?.totalElements || 0;
  const totalPages = response?.data?.totalPages || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages || 1);

  // Clear filters helper
  const handleClearFilters = () => {
    setSearch('');
    updateQuery({ keyword: null, status: null, page: 1 });
  };

  const handleRowExpandToggle = (id: number, status: string) => {
    // PENDING, REJECTED, CANCELLED requests don't show candidates
    if (status === 'PENDING' || status === 'REJECTED' || status === 'CANCELLED') {
      return;
    }
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const formatTeachingMode = (mode: string) => {
    switch (mode) {
      case 'ONLINE':
        return 'Online';
      case 'OFFLINE':
        return 'Tại nhà';
      case 'HYBRID':
        return 'Kết hợp';
      default:
        return mode;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách lớp học...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-card p-6">
        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Icons.warning size={24} />
        </div>
        <p className="text-foreground font-bold text-base">Đã xảy ra lỗi khi tải dữ liệu</p>
        <p className="text-muted-foreground mt-1 text-sm max-w-sm">
          Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
        </p>
        <Button variant="outline" className="mt-4 h-9 text-xs" onClick={() => refetch()}>
          Tải lại trang
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="rounded-2xl border bg-card shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Lớp học của tôi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Danh sách các yêu cầu tìm gia sư bạn đã tạo và trạng thái phê duyệt từ hệ thống
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer h-9 text-xs font-semibold">
            <Link href="/post-class">
              <Icons.add size={14} />
              Đăng lớp mới
            </Link>
          </Button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl w-fit border border-border/50 mb-6">
          {[
            { value: 'ALL' as const, label: 'Tất cả' },
            { value: 'PENDING' as const, label: 'Chờ duyệt' },
            { value: 'APPROVED' as const, label: 'Đang tìm gia sư' },
            { value: 'PROCESSING' as const, label: 'Đang xử lý' },
            { value: 'MATCHED' as const, label: 'Đã chốt gia sư' },
            { value: 'REJECTED' as const, label: 'Từ chối' },
            { value: 'CANCELLED' as const, label: 'Đã hủy' },
          ].map((tab) => {
            return (
              <button
                key={tab.value}
                onClick={() => {
                  updateQuery({ status: tab.value === 'ALL' ? null : tab.value, page: 1 });
                }}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
                  activeTab === tab.value
                    ? 'bg-background text-primary shadow-sm border border-border/50 font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Clean Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã lớp, môn học..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateQuery({ keyword: e.target.value || null, page: 1 });
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {(search || activeTab !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-xs gap-1.5 font-semibold"
            >
              <Icons.close size={14} />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Info panel */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3.5 py-2 rounded-xl border border-border/50 w-fit mb-6">
          <Icons.class size={14} className="text-primary" />
          <span>Tổng số lớp đã đăng: <strong>{totalElements}</strong></span>
        </div>

        {/* Content area */}
        {totalElements === 0 ? (
          search || activeTab !== 'ALL' ? (
            (() => {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-muted/10 p-6">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                    <Icons.class size={24} />
                  </div>
                  <p className="text-foreground font-semibold text-sm">
                    Không tìm thấy lớp học nào {search ? (
                      isHtmlInjectionActive ? (
                        <span dangerouslySetInnerHTML={{ __html: search }} />
                      ) : (
                        <span>"{search}"</span>
                      )
                    ) : ''}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs max-w-sm">
                    Không tìm thấy kết quả nào phù hợp với bộ lọc hiện tại của bạn.
                  </p>
                  <Button onClick={handleClearFilters} variant="link" className="mt-2 text-xs text-primary font-bold">
                    Xóa tất cả bộ lọc và hiển thị tất cả
                  </Button>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/10 p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                <Icons.class size={24} />
              </div>
              <p className="text-foreground font-semibold text-sm">Bạn chưa đăng lớp học nào</p>
              <p className="text-muted-foreground mt-1 text-xs max-w-xs">
                Đăng lớp yêu cầu tìm gia sư để kết nối với các ứng viên phù hợp nhất trên hệ thống.
              </p>
              <Button asChild className="mt-4 h-8 text-xs bg-primary text-primary-foreground">
                <Link href="/post-class">Tạo lớp học đầu tiên</Link>
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-6">

            {/* ── Desktop Table ── */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border bg-background shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-5">Mã lớp</th>
                    <th className="p-4">Môn học & Lớp</th>
                    <th className="p-4">Hình thức</th>
                    <th className="p-4 text-right">Học phí</th>
                    <th className="p-4 text-center">Buổi/Tuần</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center pr-5">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, index) => {
                    const isExpanded = expandedRowId === item.id;
                    const canExpand = item.status === 'APPROVED' || item.status === 'MATCHED';
                    const isMatched = item.status === 'MATCHED';
                    const isPending = item.status === 'PENDING';
                    const isRejectedOrCancelled = item.status === 'REJECTED' || item.status === 'CANCELLED';

                    return (
                      <Fragment key={item.id}>
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                            isExpanded && "bg-muted/15"
                          )}
                          style={{
                            animation: `rowFadeIn 400ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 40}ms both`,
                          }}
                        >
                          {/* Code */}
                          <td className="p-4 pl-5 font-mono text-xs font-bold text-foreground">
                            {item.classCode || `#${item.id}`}
                          </td>

                          {/* Subject & Grade */}
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-foreground">{item.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{item.gradeLevel}</p>
                            </div>
                          </td>

                          {/* Mode */}
                          <td className="p-4 text-muted-foreground text-xs font-medium">
                            {formatTeachingMode(item.teachingMode)}
                          </td>

                          {/* Proposed Price */}
                          <td className="p-4 font-bold text-foreground text-xs">
                            {formatPrice(item.proposedPrice)}
                          </td>

                          {/* Sessions per week */}
                          <td className="p-4 text-center font-medium text-xs">
                            {item.sessionsPerWeek} buổi
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <StatusBadge status={item.status} />
                          </td>

                          {/* Action Button */}
                          <td className="p-4 pr-5 text-center">
                            {isPending && (
                              <span className="text-xs text-muted-foreground italic">Đang chờ admin duyệt</span>
                            )}
                            {isRejectedOrCancelled && (
                              <span className="text-xs text-muted-foreground line-through">Không khả dụng</span>
                            )}
                            {canExpand && (
                              <Button
                                size="sm"
                                variant={isExpanded ? 'secondary' : (isMatched ? 'outline' : 'default')}
                                className={cn(
                                  "h-8 text-xs font-semibold cursor-pointer gap-1 px-3.5",
                                  !isExpanded && !isMatched && "bg-primary hover:bg-primary/95 text-white"
                                )}
                                onClick={() => handleRowExpandToggle(item.id, item.status)}
                              >
                                {isMatched ? (
                                  <>
                                    <Icons.class size={13} />
                                    {isExpanded ? 'Đóng thông tin' : 'Thông tin lớp học'}
                                  </>
                                ) : (
                                  <>
                                    <Icons.users size={13} />
                                    {isExpanded ? 'Đóng ứng viên' : `Ứng viên (${item.applicantsCount})`}
                                  </>
                                )}
                                <Icons.chevronDown
                                  size={12}
                                  className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
                                />
                              </Button>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Applicants Row */}
                        {isExpanded && (
                          <tr key={`${item.id}-applicants`} className="bg-muted/15 border-b last:border-b-0">
                            <td colSpan={7} className="p-0">
                              <ApplicantsList
                                classRequestId={item.id}
                                classRequestStatus={item.status}
                                onAcceptSuccess={() => refetch()}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="lg:hidden space-y-4">
              {list.map((item, index) => {
                const isExpanded = expandedRowId === item.id;
                const canExpand = item.status === 'APPROVED' || item.status === 'MATCHED';
                const isMatched = item.status === 'MATCHED';
                const isPending = item.status === 'PENDING';
                const isRejectedOrCancelled = item.status === 'REJECTED' || item.status === 'CANCELLED';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border bg-background p-4 shadow-sm space-y-3.5 transition-all overflow-hidden",
                      isExpanded && "border-primary ring-1 ring-primary/20 bg-muted/5"
                    )}
                    style={{
                      animation: `rowFadeIn 450ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 50}ms both`,
                    }}
                  >
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {item.classCode || `#${item.id}`}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Class details */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Môn học & lớp</span>
                        <strong className="text-foreground text-sm font-bold block">{item.subjectName}</strong>
                        <span className="text-muted-foreground">{item.gradeLevel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Học phí</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-extrabold text-sm block">{formatPrice(item.proposedPrice)}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Hình thức</span>
                        <span className="font-semibold text-foreground text-xs">{formatTeachingMode(item.teachingMode)}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Lịch dạy</span>
                        <span className="font-semibold text-foreground text-xs">{item.sessionsPerWeek} buổi/tuần</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Ngày đăng</span>
                        <span className="font-semibold text-foreground text-xs">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Mobile Button Actions */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-end gap-2">
                      {isPending && (
                        <p className="text-xs text-muted-foreground italic flex-1">Đang chờ admin duyệt lớp học...</p>
                      )}
                      {isRejectedOrCancelled && (
                        <p className="text-xs text-muted-foreground italic flex-1">Lớp đã đóng hoặc bị từ chối.</p>
                      )}

                      {canExpand && (
                        <Button
                          size="sm"
                          variant={isExpanded ? 'secondary' : (isMatched ? 'outline' : 'default')}
                          className={cn(
                            "w-full h-9 text-xs font-semibold cursor-pointer gap-1.5 justify-center",
                            !isExpanded && !isMatched && "bg-primary hover:bg-primary/95 text-white"
                          )}
                          onClick={() => handleRowExpandToggle(item.id, item.status)}
                        >
                          {isMatched ? (
                            <>
                              <Icons.class size={13} />
                              {isExpanded ? 'Đóng thông tin' : 'Thông tin lớp học'}
                            </>
                          ) : (
                            <>
                              <Icons.users size={13} />
                              {isExpanded ? 'Đóng ứng viên' : `Xem ứng viên (${item.applicantsCount})`}
                            </>
                          )}
                          <Icons.chevronDown
                            size={12}
                            className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
                          />
                        </Button>
                      )}
                    </div>

                    {/* Mobile Expandable area */}
                    {isExpanded && (
                      <div className="mt-4 -mx-4 -mb-4 bg-muted/15 border-t">
                        <ApplicantsList
                          classRequestId={item.id}
                          classRequestStatus={item.status}
                          onAcceptSuccess={() => refetch()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Admin-Style Pagination Panel */}
            <div className="flex w-full flex-wrap items-center justify-between gap-4 overflow-auto px-4 py-3 border-t sm:gap-8 mt-2">
              <div className="text-muted-foreground text-xs font-medium whitespace-nowrap">
                Hiển thị {Math.min((safePage - 1) * pageSize + 1, totalElements)} –{' '}
                {Math.min(safePage * pageSize, totalElements)} trên tổng số <strong>{totalElements}</strong> kết quả
              </div>
              <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 flex-wrap">
                {/* Rows per page selector */}
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-medium whitespace-nowrap">Số hàng/trang</p>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      updateQuery({ limit: Number(v), page: 1 });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-xs">
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Direct Page jump */}
                <div className="flex items-center justify-center text-xs font-medium whitespace-nowrap gap-1.5">
                  <span>Trang</span>
                  <input
                    aria-label="Đến trang"
                    type="number"
                    min={1}
                    max={totalPages}
                    value={safePage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= totalPages) {
                        updateQuery({ page: val });
                      }
                    }}
                    className="w-12 rounded-md border px-1.5 py-1 text-center text-xs bg-background h-8"
                  />
                  <span>/ {totalPages}</span>
                </div>

                {/* Page Nav buttons */}
                <div className="flex items-center space-x-1">
                  <Button
                    aria-label="Trang đầu"
                    variant="outline"
                    size="icon"
                    className="hidden size-8 lg:flex"
                    onClick={() => updateQuery({ page: 1 })}
                    disabled={safePage <= 1}
                  >
                    <Icons.chevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Trang trước"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => updateQuery({ page: Math.max(1, page - 1) })}
                    disabled={safePage <= 1}
                  >
                    <Icons.chevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Trang sau"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => updateQuery({ page: Math.min(totalPages, page + 1) })}
                    disabled={safePage >= totalPages}
                  >
                    <Icons.chevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Trang cuối"
                    variant="outline"
                    size="icon"
                    className="hidden size-8 lg:flex"
                    onClick={() => updateQuery({ page: totalPages })}
                    disabled={safePage >= totalPages}
                  >
                    <Icons.chevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
