'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Loader2, Eye, Download, Copy, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { adminTransactionsQueryOptions } from '../../api/queries';
import { TransactionDetailDialog } from './detail-dialog';
import type { TransactionResponse, TransactionFilters, TransactionStatus, PaymentMethod } from '../../api/types';
import { TableForbiddenState } from '@/components/ui/table/table-forbidden-state';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Đang xử lý (PENDING)' },
  { value: 'SUCCESS', label: 'Thành công (SUCCESS)' },
  { value: 'FAILED', label: 'Thất bại (FAILED)' },
  { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền (REFUNDED)' },
];

const METHOD_OPTIONS = [
  { value: 'VNPAY', label: 'Cổng VNPay' },
  { value: 'PAYOS', label: 'Cổng PayOS' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: TransactionStatus }) {
  const configs: Record<TransactionStatus, { label: string; className: string }> = {
    PENDING: {
      label: 'Đang chờ',
      className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700',
    },
    SUCCESS: {
      label: 'Thành công',
      className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
    },
    FAILED: {
      label: 'Thất bại',
      className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-700',
    },
    REFUNDED: {
      label: 'Đã hoàn tiền',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700',
    },
  };

  const cfg = configs[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Facet Filter Component ──────────────────────────────────────────────────

function FacetFilter({
  title,
  options,
  selected,
  onToggle,
  onClear,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed text-xs cursor-pointer">
          <Icons.plusCircle className="mr-1.5 h-3.5 w-3.5" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal text-[10px]">
                {selected.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Tìm ${title.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onToggle(option.value)}
                    className="text-xs"
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border mr-2',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </div>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={onClear} className="justify-center text-center text-xs text-red-600 font-semibold cursor-pointer">
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function TransactionManagementTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Selected Transaction ID for Detail popup
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);

  // Sync / validate parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has('page')) {
      params.set('page', '1');
      changed = true;
    }
    if (!params.has('size')) {
      params.set('size', '10');
      changed = true;
    }
    if (changed) {
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  // Derived values from URL parameters
  const page = useMemo(() => {
    const urlPage = searchParams.get('page');
    const num = urlPage ? Number(urlPage) : 1;
    return isNaN(num) || num < 1 ? 1 : num;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const urlSize = searchParams.get('size');
    const num = urlSize ? Number(urlSize) : 10;
    return isNaN(num) || num < 1 ? 10 : num;
  }, [searchParams]);

  const statusSelected = useMemo(() => {
    const status = searchParams.get('status');
    return status ? new Set([status]) : new Set<string>();
  }, [searchParams]);

  const methodSelected = useMemo(() => {
    const method = searchParams.get('paymentMethod');
    return method ? new Set([method]) : new Set<string>();
  }, [searchParams]);

  const fromDateStr = searchParams.get('fromDate') || undefined;
  const toDateStr = searchParams.get('toDate') || undefined;

  const [search, setSearch] = useState(() => searchParams.get('keyword') || '');
  const debouncedSearch = useDebounce(search, 500);

  const [isExporting, setIsExporting] = useState(false);

  // Helper to update URL query params
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!params.has('page')) params.set('page', String(page));
    if (!params.has('size')) params.set('size', String(pageSize));

    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync search input with URL changes
  useEffect(() => {
    const urlKeyword = searchParams.get('keyword') || '';
    if (urlKeyword !== search) {
      setSearch(urlKeyword);
    }
  }, [searchParams]);

  // Sync debounced search with URL
  useEffect(() => {
    const urlKeyword = searchParams.get('keyword') || '';
    if (debouncedSearch !== urlKeyword) {
      updateQuery({ keyword: debouncedSearch || null, page: 1 });
    }
  }, [debouncedSearch]);

  const goTo = (pageNum: number) => {
    if (pageNum < 1) return;
    updateQuery({ page: pageNum });
  };

  const filters: TransactionFilters = useMemo(
    () => ({
      page: page - 1, // API uses 0-based index
      limit: pageSize,
      search: debouncedSearch || undefined,
      status: statusSelected.size > 0 ? (Array.from(statusSelected)[0] as TransactionStatus) : undefined,
      paymentMethod: methodSelected.size > 0 ? (Array.from(methodSelected)[0] as PaymentMethod) : undefined,
      fromDate: fromDateStr,
      toDate: toDateStr,
    }),
    [page, pageSize, debouncedSearch, statusSelected, methodSelected, fromDateStr, toDateStr]
  );

  const { data: response, isLoading, isError, refetch } = useQuery(adminTransactionsQueryOptions(filters));
  const { content = [], totalPages = 0, totalElements = 0 } = response?.data || {};

  // CSV Exporter client-side
  const exportToCsv = (data: TransactionResponse[]) => {
    const headers = [
      'Mã giao dịch',
      'Mã tham chiếu Gateway',
      'Mã hợp đồng',
      'Gia sư',
      'Email Gia sư',
      'Số tiền',
      'Phương thức thanh toán',
      'Trạng thái',
      'Ghi chú',
      'Ngày đóng phí',
      'Ngày tạo'
    ];

    const rows = data.map((txn) => [
      txn.transactionCode,
      txn.gatewayReference || '',
      txn.contractNumber || '',
      txn.tutorName,
      txn.tutorEmail,
      txn.amount,
      txn.paymentMethod,
      txn.status,
      txn.note || '',
      txn.paidAt ? new Date(txn.paidAt).toLocaleString('vi-VN') : '',
      new Date(txn.createdAt).toLocaleString('vi-VN')
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Giao_Dich_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Export all elements (page=0, limit=99999) using query params
      const { getTransactions } = await import('../../api/service');
      const exportRes = await getTransactions({
        page: 0,
        limit: 99999,
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        search: filters.search,
        fromDate: filters.fromDate,
        toDate: filters.toDate
      });

      if (exportRes.data?.content && exportRes.data.content.length > 0) {
        exportToCsv(exportRes.data.content);
        toast.success(`Đã xuất thành công ${exportRes.data.content.length} giao dịch.`);
      } else {
        toast.warning('Không có dữ liệu giao dịch để xuất.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xuất file báo cáo giao dịch.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

  const isFiltered = statusSelected.size > 0 || methodSelected.size > 0 || search || fromDateStr !== undefined || toDateStr !== undefined;

  const resetFilters = () => {
    setSearch('');
    updateQuery({
      keyword: null,
      status: null,
      paymentMethod: null,
      fromDate: null,
      toDate: null,
      page: 1,
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  const safePage = Math.min(Math.max(page, 1), totalPages || 1);
  const pageCount = totalPages || 1;

  // Calendar dates derived from query
  const calendarRange = useMemo(() => {
    const from = fromDateStr ? new Date(fromDateStr) : undefined;
    const to = toDateStr ? new Date(toDateStr) : undefined;
    return { from, to };
  }, [fromDateStr, toDateStr]);

  const handleRangeSelect = (range: any) => {
    const from = range?.from ? format(range.from, 'yyyy-MM-dd') : null;
    const to = range?.to ? format(range.to, 'yyyy-MM-dd') : null;
    updateQuery({ fromDate: from, toDate: to, page: 1 });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 font-sans">
        {/* ─── Search & Filters ─── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Tìm theo mã giao dịch, mã hợp đồng, tên/email gia sư..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 shrink-0">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                className="h-9 w-9 cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>

              {/* Export Button */}
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2 text-xs font-semibold h-9 cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Download className="h-4 w-4 text-emerald-600" />
                )}
                Xuất file báo cáo
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status facet filter */}
            <FacetFilter
              title="Trạng thái giao dịch"
              options={STATUS_OPTIONS}
              selected={statusSelected}
              onToggle={(value) => {
                const newStatus = statusSelected.has(value) ? null : value;
                updateQuery({ status: newStatus, page: 1 });
              }}
              onClear={() => {
                updateQuery({ status: null, page: 1 });
              }}
            />

            {/* Method facet filter */}
            <FacetFilter
              title="Phương thức thanh toán"
              options={METHOD_OPTIONS}
              selected={methodSelected}
              onToggle={(value) => {
                const newMethod = methodSelected.has(value) ? null : value;
                updateQuery({ paymentMethod: newMethod, page: 1 });
              }}
              onClear={() => {
                updateQuery({ paymentMethod: null, page: 1 });
              }}
            />

            {/* Date range picker popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 cursor-pointer">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {calendarRange?.from ? (
                    calendarRange.to ? (
                      `${format(calendarRange.from, 'dd/MM/yyyy')} - ${format(calendarRange.to, 'dd/MM/yyyy')}`
                    ) : (
                      format(calendarRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    'Khoảng thời gian'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={calendarRange}
                  onSelect={handleRangeSelect}
                  numberOfMonths={2}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <Cross2Icon className="mr-1 h-3 w-3" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[150px]">Mã giao dịch</TableHead>
                <TableHead className="w-[120px]">Hợp đồng</TableHead>
                <TableHead>Gia sư</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày thực hiện</TableHead>
                <TableHead className="text-right w-[100px]">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Đang tải danh sách giao dịch...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableForbiddenState colSpan={8} />
              ) : content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground font-medium">
                    Không tìm thấy giao dịch nào
                  </TableCell>
                </TableRow>
              ) : (
                content.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/20 transition-colors">
                    {/* Mã giao dịch */}
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                        <span>{txn.transactionCode}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyText(txn.transactionCode)}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Mã hợp đồng */}
                    <TableCell className="align-middle font-mono text-xs text-muted-foreground">
                      {txn.contractNumber ? (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">{txn.contractNumber}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyText(txn.contractNumber || '')}
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>

                    {/* Gia sư */}
                    <TableCell className="align-middle">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-foreground">{txn.tutorName}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{txn.tutorEmail}</p>
                      </div>
                    </TableCell>

                    {/* Số tiền */}
                    <TableCell className="align-middle text-sm font-bold text-foreground">
                      {formatMoney(txn.amount)}
                    </TableCell>

                    {/* Phương thức */}
                    <TableCell className="align-middle text-xs font-semibold text-muted-foreground">
                      {txn.paymentMethod}
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell className="align-middle">
                      <StatusBadge status={txn.status} />
                    </TableCell>

                    {/* Ngày thực hiện */}
                    <TableCell className="align-middle text-xs text-muted-foreground font-mono">
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleDateString('vi-VN') + ' ' + new Date(txn.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right align-middle">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 cursor-pointer text-primary border-primary/20 hover:bg-primary/5"
                            onClick={() => setSelectedTxnId(txn.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem chi tiết giao dịch</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto px-4 py-3 border-t sm:gap-8 bg-muted/20 rounded-xl border">
          <div className="text-muted-foreground text-sm font-medium whitespace-nowrap">
            Tổng cộng: <strong className="text-foreground">{totalElements}</strong> giao dịch
          </div>
          <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
            {/* Rows per page */}
            <div className="hidden items-center space-x-2 sm:flex">
              <p className="text-sm font-medium whitespace-nowrap">Mỗi trang</p>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => updateQuery({ size: Number(v), page: 1 })}
              >
                <SelectTrigger className="h-8 w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page input */}
            <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap gap-2">
              <span className="hidden sm:inline">Trang</span>
              <input
                aria-label="Đến trang"
                type="number"
                min={1}
                max={pageCount}
                value={safePage}
                onChange={(e) => goTo(Number(e.target.value))}
                className="w-14 rounded-md border px-2 py-1 text-center text-sm bg-background font-semibold"
              />
              <span className="text-sm hidden sm:inline">/ {pageCount}</span>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center space-x-1">
              <Button
                aria-label="Trang đầu"
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex cursor-pointer"
                onClick={() => goTo(1)}
                disabled={safePage <= 1}
              >
                <Icons.chevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang trước"
                variant="outline"
                size="icon"
                className="size-8 cursor-pointer"
                onClick={() => goTo(safePage - 1)}
                disabled={safePage <= 1}
              >
                <Icons.chevronLeft className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang sau"
                variant="outline"
                size="icon"
                className="size-8 cursor-pointer"
                onClick={() => goTo(safePage + 1)}
                disabled={safePage >= pageCount}
              >
                <Icons.chevronRight className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang cuối"
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex cursor-pointer"
                onClick={() => goTo(pageCount)}
                disabled={safePage >= pageCount}
              >
                <Icons.chevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Detail Dialog ─── */}
        <TransactionDetailDialog id={selectedTxnId} onOpenChange={(open) => !open && setSelectedTxnId(null)} />
      </div>
    </TooltipProvider>
  );
}
