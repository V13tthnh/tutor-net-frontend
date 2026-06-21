'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { myContractsQueryOptions } from '../api/queries';
import { signContract } from '../api/service';
import type { ContractResponse, ContractStatus, ContractFilters } from '../api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Page size constants
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Format currency in VND
function formatCurrency(amount: number) {
  if (amount === undefined || amount === null) return '0';
  return amount.toLocaleString('vi-VN') + ' đ';
}

// Format date string to Vietnamese localized format
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

// Render status badge dynamically
function StatusBadge({ status }: { status: ContractStatus }) {
  const configs: Record<
    ContractStatus,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      icon: React.ComponentType<{ size?: number; className?: string }>;
    }
  > = {
    DRAFT: {
      label: 'Bản nháp',
      variant: 'outline',
      icon: Icons.forms,
    },
    PENDING_SIGNATURE: {
      label: 'Chờ ký số',
      variant: 'outline',
      icon: Icons.clock,
    },
    ACTIVE: {
      label: 'Đang hiệu lực',
      variant: 'default',
      icon: Icons.shieldCheck,
    },
    COMPLETED: {
      label: 'Đã hoàn thành',
      variant: 'secondary',
      icon: Icons.circleCheck,
    },
    CANCELLED: {
      label: 'Đã hủy',
      variant: 'outline',
      icon: Icons.circleX,
    },
    VIOLATED: {
      label: 'Vi phạm',
      variant: 'destructive',
      icon: Icons.warning,
    },
  };

  const config = configs[status] || { label: status, variant: 'outline', icon: Icons.help };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'gap-1.5 py-1 px-2.5 font-medium border text-xs whitespace-nowrap',
        (status === 'DRAFT' || status === 'PENDING_SIGNATURE') &&
          'bg-amber-50 hover:bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
        status === 'ACTIVE' &&
          'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600',
        status === 'COMPLETED' &&
          'bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900',
        (status === 'CANCELLED' || status === 'VIOLATED') &&
          'bg-rose-50 hover:bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
      )}
    >
      <Icon size={12} className="flex-shrink-0" />
      {config.label}
    </Badge>
  );
}

export default function MyContractsList() {
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const isTutor = user?.roles?.includes('tutor') || false;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ─── Handle VNPay return URL ──────────────────────────────────────────────
  const vnpayHandled = useRef(false);
  useEffect(() => {
    // Guard against double-fire in React StrictMode
    if (vnpayHandled.current) return;

    const paymentStatus = searchParams.get('payment');
    // Only run if the payment parameter is present
    if (!paymentStatus) return;

    vnpayHandled.current = true;

    const contractCode = searchParams.get('contractCode') || '';

    if (paymentStatus === 'success') {
      // ✅ Success
      toast.success('Thanh toán hợp đồng thành công!', {
        description: (
          <div className="space-y-1 text-xs mt-1">
            {contractCode && (
              <div>
                <span className="font-semibold">Mã hợp đồng:</span> {contractCode}
              </div>
            )}
            <div className="text-muted-foreground">
              Hệ thống đã ghi nhận thanh toán phí nhận lớp của bạn.
            </div>
          </div>
        ),
        duration: 8000,
      });
      // Refresh the contracts list to show updated status
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    } else {
      // ❌ Payment failed
      toast.error('Thanh toán không thành công', {
        description: (
          <div className="space-y-1 text-xs mt-1">
            {contractCode && (
              <div>
                <span className="font-semibold">Mã hợp đồng:</span> {contractCode}
              </div>
            )}
            <div className="text-muted-foreground">
              Giao dịch thanh toán phí nhận lớp đã thất bại hoặc bị hủy. Vui lòng thử lại.
            </div>
          </div>
        ),
        duration: 7000,
      });
    }

    // 🧹 Strip payment and contractCode params from the URL to keep it clean
    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete('payment');
    cleanParams.delete('contractCode');
    const cleanQuery = cleanParams.toString();
    router.replace(`${pathname}${cleanQuery ? `?${cleanQuery}` : ''}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return (urlStatus || 'ALL') as 'ALL' | ContractStatus;
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

  // Clickwrap dialog state
  const [signingContract, setSigningContract] = useState<ContractResponse | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

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
  const filters: ContractFilters = useMemo(
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

  // Fetch paginated contracts
  const { data: response, isLoading, isError, refetch } = useQuery(
    myContractsQueryOptions(filters)
  );

  const { content: paginatedContracts = [], totalElements = 0, totalPages = 1 } = response?.data || {};
  const safePage = Math.min(Math.max(page, 1), totalPages || 1);

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: signContract,
    onSuccess: () => {
      toast.success('Ký kết hợp đồng điện tử thành công!');
      setSigningContract(null);
      setTermsAgreed(false);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Có lỗi xảy ra trong quá trình ký số. Vui lòng thử lại.');
    },
  });

  // Clear filters helper
  const handleClearFilters = () => {
    setSearch('');
    updateQuery({ keyword: null, status: null, page: 1 });
  };

  const handleOpenSignModal = (contract: ContractResponse) => {
    setSigningContract(contract);
    setTermsAgreed(false);
  };

  const handleSignSubmit = async () => {
    if (!signingContract || !termsAgreed) return;
    await signMutation.mutateAsync(signingContract.id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card rounded-2xl border">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách hợp đồng...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-card p-6">
        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Icons.warning size={24} />
        </div>
        <p className="text-foreground font-bold text-base">Đã xảy ra lỗi khi tải dữ liệu hợp đồng</p>
        <p className="text-muted-foreground mt-1 text-sm max-w-sm">
          Không thể kết nối đến hệ thống máy chủ. Vui lòng thử lại sau.
        </p>
        <Button variant="outline" className="mt-4 h-9 text-xs" onClick={() => refetch()}>
          Tải lại dữ liệu
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

      <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
        {/* Header */}
        <div className="border-b pb-5">
          <h2 className="text-xl font-bold tracking-tight">Hợp đồng của tôi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Xem, tải bản in PDF hoặc thực hiện ký kết hợp đồng dạy học trực tuyến
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl w-fit border border-border/50">
          {[
            { value: 'ALL' as const, label: 'Tất cả' },
            { value: 'PENDING_SIGNATURE' as const, label: 'Chờ ký số' },
            { value: 'ACTIVE' as const, label: 'Đang hiệu lực' },
            { value: 'COMPLETED' as const, label: 'Đã hoàn thành' },
            { value: 'CANCELLED' as const, label: 'Đã hủy' },
            { value: 'VIOLATED' as const, label: 'Vi phạm' },
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã HĐ, mã lớp, môn học, đối tác..."
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

        {/* Data list table */}
        {totalElements === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-muted/10 p-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <Icons.forms size={24} />
            </div>
            <p className="text-foreground font-semibold text-sm">Không tìm thấy hợp đồng nào</p>
            <p className="text-muted-foreground mt-1 text-xs max-w-sm">
              Bạn chưa có hợp đồng nào phù hợp với bộ lọc hiện tại.
            </p>
            {(search || activeTab !== 'ALL') && (
              <Button onClick={handleClearFilters} variant="link" className="mt-2 text-xs text-primary font-bold">
                Xóa tất cả bộ lọc và hiển thị tất cả
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border bg-background shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-5">Mã hợp đồng</th>
                    <th className="p-4">Mã lớp</th>
                    <th className="p-4">Môn học</th>
                    <th className="p-4">Đối tác</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4 text-center font-bold">Trạng thái</th>
                    <th className="p-4 text-center pr-5">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.map((contract, idx) => {
                    const isSignable = isTutor && (contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE');
                    const hasPdf = !!contract.contractFileUrl;

                    return (
                      <tr
                        key={contract.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        style={{
                          animation: `rowFadeIn 350ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 40}ms both`,
                        }}
                      >
                        {/* Contract Number */}
                        <td className="p-4 pl-5 font-mono text-xs font-bold text-foreground">
                          {contract.contractNumber}
                        </td>

                        {/* Class Code */}
                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          {contract.classCode || 'N/A'}
                        </td>

                        {/* Subject */}
                        <td className="p-4 font-semibold text-foreground text-xs">
                          {contract.subjectName}
                        </td>

                        {/* Partner */}
                        <td className="p-4 text-xs font-medium text-foreground">
                          {contract.partnerName || 'Chưa có'}
                        </td>

                        {/* Created At */}
                        <td className="p-4 text-xs text-muted-foreground">
                          {formatDate(contract.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <StatusBadge status={contract.status} />
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-5 text-center">
                          {isSignable ? (
                            <Button
                              size="sm"
                              className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer px-4 shadow-sm"
                              onClick={() => handleOpenSignModal(contract)}
                            >
                              <Icons.edit size={12} className="mr-1" />
                              Xem & Ký
                            </Button>
                          ) : hasPdf ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold cursor-pointer border-primary/30 text-primary hover:bg-primary/10 px-4"
                              onClick={() => window.open(contract.contractFileUrl, '_blank')}
                            >
                              <Icons.fileTypePdf size={12} className="mr-1 text-rose-500" />
                              Xem PDF
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Đang cập nhật</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-3">
              {paginatedContracts.map((contract, idx) => {
                const isSignable = isTutor && (contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE');
                const hasPdf = !!contract.contractFileUrl;

                return (
                  <div
                    key={contract.id}
                    className="border rounded-xl p-4 bg-background shadow-sm space-y-3.5"
                    style={{
                      animation: `rowFadeIn 400ms cubic-bezier(0.22, 1, 0.36, 1) ${idx * 45}ms both`,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-border/50">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {contract.contractNumber}
                      </span>
                      <StatusBadge status={contract.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Môn học</span>
                        <strong className="text-foreground text-xs font-semibold block leading-tight">{contract.subjectName}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Mã lớp</span>
                        <span className="font-mono text-xs font-medium text-foreground">{contract.classCode || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2 text-muted-foreground">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Đối tác</span>
                        <span className="font-semibold text-foreground text-xs">{contract.partnerName || 'Chưa có'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Ngày tạo</span>
                        <span className="font-semibold text-foreground text-xs">{formatDate(contract.createdAt)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                      {isSignable ? (
                        <Button
                          size="sm"
                          className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/95 text-white"
                          onClick={() => handleOpenSignModal(contract)}
                        >
                          <Icons.edit size={12} className="mr-1" />
                          Xem & Ký hợp đồng
                        </Button>
                      ) : hasPdf ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-9 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => window.open(contract.contractFileUrl, '_blank')}
                        >
                          <Icons.fileTypePdf size={12} className="mr-1.5 text-rose-500" />
                          Tải/Xem văn bản PDF
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic w-full text-center">Không có thao tác</span>
                      )}
                    </div>
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

      {/* Clickwrap Signature Modal */}
      <Dialog open={!!signingContract} onOpenChange={(open) => !open && setSigningContract(null)}>
        <DialogContent className="flex w-[95vw] max-w-4xl flex-col overflow-hidden rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">Hợp đồng dịch vụ và nhận lớp học</DialogTitle>

          {/* Dialog Header */}
          <header className="flex shrink-0 items-center justify-between px-6 py-4 bg-primary text-primary-foreground">
            <span className="font-bold text-base tracking-wide flex items-center gap-2">
              <Icons.cv size={18} />
              Hợp đồng dịch vụ và nhận lớp học (Bản nháp)
            </span>
            <button
              type="button"
              onClick={() => setSigningContract(null)}
              aria-label="Đóng"
              className="rounded-full p-1.5 transition-colors hover:bg-primary-foreground/10 text-primary-foreground cursor-pointer"
            >
              <Icons.close size={18} />
            </button>
          </header>

          {/* Legal document terms block */}
          {signingContract && (
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-neutral-100 dark:bg-neutral-900/40 text-neutral-800 dark:text-neutral-200">
              <div className="bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-lg shadow-sm border font-serif max-w-[900px] mx-auto text-[13px] sm:text-[14px] leading-relaxed text-black dark:text-neutral-100 text-justify">
                {/* Quốc hiệu */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-neutral-300 dark:border-neutral-800 pb-4 mb-6 font-sans text-xs">
                  <div className="text-center sm:text-left">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">HỆ THỐNG KẾT NỐI GIA SƯ TUTORNET</div>
                    <div className="italic text-neutral-500">Website: www.tutornet.vn</div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 text-center">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 text-center">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="italic text-neutral-500 mt-1 text-center">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                  </div>
                </div>

                {/* Tiêu đề chính */}
                <div className="text-center mb-6 font-sans">
                  <h1 className="text-lg sm:text-xl font-bold tracking-wide uppercase text-neutral-900 dark:text-neutral-50">HỢP ĐỒNG DỊCH VỤ VÀ GIAO NHẬN LỚP HỌC</h1>
                  <h2 className="text-sm font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 mt-1 uppercase">(MÔ HÌNH HỢP ĐỒNG BA BÊN ĐIỆN TỬ)</h2>
                </div>

                {/* Căn cứ pháp lý */}
                <div className="space-y-1 text-neutral-600 dark:text-neutral-400 italic mb-6 text-xs sm:text-sm">
                  <p>Căn cứ Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam số 91/2015/QH13 ngày 24/11/2015;</p>
                  <p>Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 ngày 22/06/2023;</p>
                  <p>Căn cứ Điều khoản và Điều kiện sử dụng dịch vụ của Nền tảng kết nối gia sư TutorNet có hiệu lực từ ngày 01/12/2024;</p>
                  <p>Dựa trên sự thỏa thuận tự nguyện, bình đẳng và thiện chí của các Bên dưới đây:</p>
                </div>

                {/* PHẦN I */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-sans font-bold text-sm uppercase border-b pb-1 text-neutral-900 dark:text-neutral-200">PHẦN I: THÔNG TIN CÁC BÊN THAM GIA</h3>

                  <div className="space-y-1.5">
                    <p className="font-bold">1. BÊN CUNG CẤP DỊCH VỤ / NỀN TẢNG (BÊN A): HỆ THỐNG GIA SƯ TUTORNET</p>
                    <div className="pl-4 text-neutral-700 dark:text-neutral-300">
                      <div>• Đại diện bởi: Ban Quản Trị Hệ Thống TutorNet</div>
                      <div>• Hotline hỗ trợ: 0999.XXX.XXX</div>
                      <div>• Vai trò: Đơn vị trung gian công nghệ cung cấp thông tin, điều phối, bảo hộ giao dịch và hỗ trợ giải quyết tranh chấp.</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold">2. KHÁCH HÀNG / GIA SƯ (BÊN B):</p>
                    <div className="pl-4 text-neutral-700 dark:text-neutral-300">
                      <div>• Họ và tên gia sư: <span className="font-bold uppercase">{isTutor ? user?.fullName?.toUpperCase() : signingContract.partnerName?.toUpperCase()}</span></div>
                      <div>• Năm sinh: {isTutor ? (user as any)?.birthYear || 'N/A' : 'N/A'}</div>
                      <div>• Số điện thoại liên hệ: {isTutor ? (user as any)?.phone || 'N/A' : 'N/A'}</div>
                      <div>• Email hệ thống: {isTutor ? user?.email : 'N/A'}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold">3. PHỤ HUYNH / HỌC SINH (BÊN C):</p>
                    <div className="pl-4 text-neutral-700 dark:text-neutral-300">
                      <div>• Họ và tên người đại diện: <span className="font-bold uppercase">{isTutor ? `${signingContract.partnerName?.toUpperCase()} (PHỤ HUYNH)` : `${user?.fullName?.toUpperCase()} (PHỤ HUYNH)`}</span></div>
                      <div>• Số điện thoại liên hệ: <span className="italic text-neutral-500">{isTutor ? `${signingContract.contactPhone || 'N/A'} (Sẽ được mở khóa sau khi ký nhận)` : (user as any)?.phone || 'N/A'}</span></div>
                      <div>• Email nhận thông báo: <span className="italic text-neutral-500">{isTutor ? 'Không có (Sẽ được mở khóa sau khi ký nhận)' : user?.email || 'N/A'}</span></div>
                      <div>• Địa chỉ giảng dạy: <span className="italic text-neutral-500">Theo thỏa thuận</span></div>
                    </div>
                  </div>
                </div>

                {/* PHẦN II */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-sans font-bold text-sm uppercase border-b pb-1 text-neutral-900 dark:text-neutral-200">PHẦN II: CÁC ĐIỀU KHOẢN VÀ ĐIỀU KIỆN CHUNG</h3>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 1: Thông tin lớp học và Thỏa thuận giảng dạy</p>
                    <p className="text-neutral-700 dark:text-neutral-300">Bên A tiến hành điều phối và bàn giao thông tin lớp học theo yêu cầu của Bên C cho Bên B thực hiện công tác giảng dạy với các chi tiết cụ thể như sau:</p>

                    <div className="overflow-x-auto my-3 font-sans text-xs">
                      <table className="w-full border-collapse border border-neutral-300 dark:border-neutral-800 text-left">
                        <tbody>
                          <tr>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold w-1/4">Mã lớp học</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2 font-bold text-primary">{signingContract.classCode}</td>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold w-1/4">Môn học & Lớp</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2">{signingContract.subjectName}</td>
                          </tr>
                          <tr>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold">Học phí thỏa thuận</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2 font-bold">Theo thỏa thuận của lớp</td>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold">Dạy thử miễn phí</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2">0{signingContract.freeTrialCount || 1} buổi đầu tiên (Thời lượng: 60 - 90 phút)</td>
                          </tr>
                          <tr>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold">Thời gian học</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2" colSpan={3}>Theo thỏa thuận</td>
                          </tr>
                          <tr>
                            <th className="border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 font-bold">Địa điểm giảng dạy</th>
                            <td className="border border-neutral-300 dark:border-neutral-800 p-2" colSpan={3}>Theo thỏa thuận</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 2: Thù lao và Phương thức thanh toán (Giữa Bên B và Bên C)</p>
                    <p className="text-neutral-700 dark:text-neutral-300">2.1 Mức thù lao giảng dạy (Học phí) được áp dụng cố định theo thỏa thuận tại Điều 1 của Hợp đồng này. Bên B không được tự ý yêu cầu tăng học phí hoặc thay đổi cấu trúc giờ học khi chưa có sự đồng ý bằng văn bản của Bên C và sự chứng kiến của Bên A.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">2.2 Phương thức thanh toán: Học phí sẽ được Bên C thanh toán trực tiếp cho Bên B bằng tiền mặt hoặc chuyển khoản qua tài khoản ngân hàng cá nhân vào cuối mỗi tháng học hoặc theo chu kỳ thỏa thuận riêng giữa Bên B và Bên C.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">2.3 Bên A hoàn toàn không tham gia trực tiếp vào quy trình thu/giữ học phí và không chịu trách nhiệm tài chính đối với việc chậm trễ thanh toán học phí từ Bên C cho Bên B.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 3: Phí giao lớp, Hạn thanh toán và Chính sách hoàn phí (Giữa Bên A và Bên B)</p>
                    <p className="text-neutral-700 dark:text-neutral-300">3.1 Phí giao lớp (Phí giới thiệu): Bên B có trách nhiệm thanh toán cho Bên A khoản phí môi giới một lần duy nhất trị giá: <span className="font-bold text-neutral-900 dark:text-neutral-50">{signingContract.introductionFee.toLocaleString('vi-VN')} VND</span>.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">3.2 Hạn thanh toán: Chậm nhất là <span className="font-bold">35 ngày</span> kể từ Ngày Giao Lớp hệ thống ghi nhận.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">3.3 Cơ chế phân bậc phí dựa trên vòng đời thực tế của Lớp học (Bảo hộ rủi ro lớp hỏng):</p>
                    <div className="pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
                      <div>• <span className="font-bold">Mức 0% (Không thu phí):</span> Nếu Lớp Học Dừng Lại trong khoảng thời gian từ ngày 1 đến ngày 15 kể từ ngày giao lớp do nguyên nhân khách quan. Bên B hoàn toàn được miễn trừ trách nhiệm đóng phí giới thiệu sau khi Bên A xác minh thông tin thành công.</div>
                      <div>• <span className="font-bold">Mức 50%:</span> Nếu Lớp Học Dừng Lại trong khoảng thời gian từ ngày 16 đến ngày 30 kể từ ngày giao lớp.</div>
                      <div>• <span className="font-bold">Mức 100%:</span> Nếu Lớp Học diễn ra thành công và ổn định vượt quá 30 ngày kể từ ngày giao lớp.</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 4: Quyền và Nghĩa vụ của Bên A (Nền tảng)</p>
                    <p className="text-neutral-700 dark:text-neutral-300">4.1 Đảm bảo cung cấp đầy đủ, chính xác thông tin lớp học, yêu cầu của học viên cho Bên B.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">4.2 Hệ thống tự động áp dụng cơ chế <span className="italic">Masking (Che giấu thông tin liên hệ bảo mật)</span> đối với Số điện thoại và Email của Bên C trên giao diện của Bên B cho đến khi Bên B thực hiện lệnh xác nhận ký Hợp đồng này.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">4.3 Tiếp nhận thông tin báo hỏng lớp, tiến hành hậu kiểm độc lập và xử lý chốt mức phí môi giới công bằng theo quy định tại Điều 3.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">4.4 Miễn trừ trách nhiệm: Bên A không chịu trách nhiệm về chất lượng giảng dạy thực tế của Bên B, tác phong hành vi dân sự bên ngoài ứng dụng của các bên, cũng như không can thiệp vào các tranh chấp phát sinh nằm ngoài phạm vi điều khoản giao dịch này.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 5: Quyền và Nghĩa vụ của Bên B (Gia sư)</p>
                    <p className="text-neutral-700 dark:text-neutral-300">5.1 Ngay sau khi ký hợp đồng trực tuyến và nhận được thông tin liên hệ của Bên C, Bên B phải chủ động gọi điện trao đổi, hẹn lịch buổi dạy thử miễn phí trước với Bên C trong vòng 24 giờ.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">5.2 Tuân thủ tuyệt đối quy định dạy thử 01 buổi đầu tiên miễn phí, chuẩn bị giáo án nghiêm túc, đúng trình độ và lớp học yêu cầu.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">5.3 <span className="font-bold">Quy định nghiêm ngặt về bảo mật thông tin:</span> Tuyệt đối không cung cấp, chuyển nhượng thông tin lớp học này cho bất kỳ bên thứ ba nào dưới mọi hình thức. Tuyệt đối không trao đổi, thảo luận hoặc truyền đạt bất kỳ nội dung nào liên quan đến "Phí giao lớp" hoặc chiết khấu hệ thống với Bên C. Vi phạm sẽ bị khóa tài khoản vĩnh viễn.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">5.4 Đảm bảo tác phong sư phạm, dạy đúng giờ. Trường hợp bận bất khả kháng nghỉ dạy phải thông báo trước ít nhất 3 giờ và dạy bù phù hợp.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 6: Quyền và Nghĩa vụ của Bên C (Phụ huynh / Học sinh)</p>
                    <p className="text-neutral-700 dark:text-neutral-300">6.1 Đôn đốc, nhắc nhở con em tham gia học tập đúng giờ, chuẩn bị không gian học tập đủ ánh sáng, yên tĩnh.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">6.2 Thanh toán học phí cho Bên B đầy đủ, đúng thời hạn như đã cam kết tại Điều 2.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">6.3 Được quyền yêu cầu Bên A hỗ trợ đổi gia sư khác hoàn toàn miễn phí hoặc yêu cầu dừng lớp học nếu xét thấy gia sư dạy không đạt hiệu quả.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 7: Chế tài vi phạm và Biện pháp xử lý bùng phí</p>
                    <p className="text-neutral-700 dark:text-neutral-300">7.1 Trường hợp Bên B tiếp tục duy trì việc giảng dạy thực tế tại nhà Bên C nhưng cố tình trốn tránh, quá hạn 35 ngày không hoàn thành nghĩa vụ nộp phí giao lớp cho Bên A, hệ thống sẽ tự động kích hoạt các chế tài nghiêm khắc:</p>
                    <div className="pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
                      <div>• Đình chỉ lập tức quyền truy cập tài khoản, chuyển trạng thái hồ sơ thành <span className="font-bold">VIOLATED/SUSPENDED</span> và đưa vào Danh sách đen.</div>
                      <div>• Bên A có quyền gửi văn bản thông báo miễn trừ trách nhiệm đến Bên C, nêu rõ hành vi vi phạm hợp đồng của gia sư.</div>
                      <div>• Tùy theo mức độ thiệt hại, Bên A bảo lưu quyền khởi kiện Bên B ra cơ quan Công an có thẩm quyền về tội "Lạm dụng tín nhiệm chiếm đoạt tài sản" theo Điều 140 Bộ luật Hình sự.</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold">Điều 8: Giải quyết tranh chấp và Hiệu lực hợp đồng</p>
                    <p className="text-neutral-700 dark:text-neutral-300">8.1 Hợp đồng này được lập dưới dạng hợp đồng điện tử dựa trên hành vi xác thực số. Các Bên cam kết thực hiện đầy đủ các điều khoản.</p>
                    <p className="text-neutral-700 dark:text-neutral-300">8.2 Hợp đồng có hiệu lực pháp lý kể từ thời điểm hệ thống ghi nhận hành vi bấm nút "Xác nhận đồng ý ký hợp đồng trực tuyến" thành công từ Bên B.</p>
                  </div>
                </div>

                {/* CLICKWRAP EVIDENCE BOX */}
                <div className="border border-dashed border-primary/40 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg my-6 font-sans text-xs space-y-1.5">
                  <div className="font-bold uppercase text-primary/95 text-[11px] border-b pb-1 mb-2 tracking-wide">
                    THÔNG TIN XÁC THỰC CHỨNG CỨ KÝ ĐIỆN TỬ (CLICKWRAP EVIDENCE BOX)
                  </div>
                  <div>• <span className="font-bold">Trạng thái giao dịch:</span> <span className="font-semibold text-amber-600">BẢN NHÁP CHỜ KÝ CHỨNG THỰC (PENDING SIGNATURE)</span></div>
                  <div>• <span className="font-bold">Địa chỉ IP thực thi:</span> <span className="text-neutral-500">[Hệ thống sẽ ghi nhận IP của bạn khi bấm Ký]</span></div>
                  <div>• <span className="font-bold">Mã băm dữ liệu (Hash ID):</span> <span className="text-neutral-500">[Sẽ tự động băm sinh mã Hash an toàn sau khi tạo file PDF]</span></div>
                  <div>• <span className="font-bold">Thời gian ghi nhận hệ thống (Timestamp):</span> <span className="text-neutral-500">[Thời gian thực tế lúc bấm Ký số]</span></div>
                  <p className="italic text-neutral-500 mt-2 text-[10px]">
                    * Ghi chú: Văn bản này được lưu trữ dưới dạng điện tử bảo mật trên máy chủ TutorNet. Bản sao hợp pháp sẽ được tự động biên dịch sang định dạng PDF bất biến và gửi đồng thời đến hòm thư Email đăng ký của Phụ huynh và Gia sư để làm căn cứ pháp lý đối soát chéo.
                  </p>
                </div>

                {/* Bảng chữ ký ba bên */}
                <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs sm:text-sm pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6">
                  <div>
                    <div className="font-bold">ĐẠI DIỆN BÊN A</div>
                    <div className="text-neutral-500 text-[10px] italic mt-1">(Đã ký điện tử)</div>
                    <div className="font-bold mt-12 text-neutral-800 dark:text-neutral-300">TutorNet Ban Quản Trị</div>
                  </div>
                  <div>
                    <div className="font-bold">ĐẠI DIỆN BÊN B</div>
                    <div className="text-neutral-500 text-[10px] italic mt-1">(Xác thực qua tài khoản)</div>
                    <div className="font-bold mt-12 text-neutral-800 dark:text-neutral-300 uppercase">{isTutor ? user?.fullName : signingContract.partnerName}</div>
                  </div>
                  <div>
                    <div className="font-bold">ĐẠI DIỆN BÊN C</div>
                    <div className="text-neutral-500 text-[10px] italic mt-1">(Xác thực qua yêu cầu)</div>
                    <div className="font-bold mt-12 text-neutral-800 dark:text-neutral-300 uppercase">{isTutor ? signingContract.partnerName : user?.fullName}</div>
                  </div>
                </div>

                <div className="text-center text-[10px] italic text-neutral-400 mt-8 border-t pt-2 font-sans">
                  Hợp đồng điện tử ba bên có hiệu lực kể từ thời điểm ký. Mọi thay đổi phải được sự đồng thuận và lưu trữ trên hệ thống.
                </div>
              </div>
            </div>
          )}

          {/* Verification check & Actions */}
          <DialogFooter className="px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
            <div className="flex items-start gap-2.5 max-w-lg text-left">
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                className="mt-0.5"
                disabled={signMutation.isPending}
              />
              <label htmlFor="terms" className="text-xs font-medium text-muted-foreground leading-tight cursor-pointer select-none hover:text-foreground transition-colors">
                Tôi đã đọc, hiểu và cam kết tuân thủ các điều khoản hợp đồng điện tử ba bên nêu trên.
              </label>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <Button
                variant="outline"
                onClick={() => setSigningContract(null)}
                disabled={signMutation.isPending}
                className="h-9 px-4 cursor-pointer text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                className="h-9 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 cursor-pointer text-xs"
                disabled={!termsAgreed || signMutation.isPending}
                onClick={handleSignSubmit}
              >
                {signMutation.isPending ? (
                  <>
                    <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
                    Đang ký nhận...
                  </>
                ) : (
                  <>
                    <Icons.circleCheck className="h-3.5 w-3.5" />
                    Xác nhận Ký & Nhận lớp
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
