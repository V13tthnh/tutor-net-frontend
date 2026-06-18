'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, FileText, CheckCircle2, ShieldAlert, Download, AlertTriangle, HelpCircle, PhoneCall, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { adminContractsQueryOptions } from '../../api/queries';
import { confirmContractPayment, getContractsForExport } from '../../api/service';
import { DisputeDialog } from './dispute-dialog';
import type { AdminContractResponse, AdminContractFilters, AdminContractStatus } from '../../api/types';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Nháp (DRAFT)' },
  { value: 'PENDING_SIGNATURE', label: 'Chờ ký (PENDING_SIGNATURE)' },
  { value: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)' },
  { value: 'COMPLETED', label: 'Hoàn thành (COMPLETED)' },
  { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
  { value: 'VIOLATED', label: 'Vi phạm (VIOLATED)' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Status Badge Component ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdminContractStatus }) {
  const configs: Record<AdminContractStatus, { label: string; className: string }> = {
    DRAFT: {
      label: 'Bản nháp',
      className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    },
    PENDING_SIGNATURE: {
      label: 'Chờ ký',
      className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700',
    },
    ACTIVE: {
      label: 'Hoạt động',
      className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
    },
    COMPLETED: {
      label: 'Hoàn thành',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-700',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-700',
    },
    VIOLATED: {
      label: 'Vi phạm',
      className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700',
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
        <Button variant="outline" size="sm" className="h-8 border-dashed text-xs">
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

export function ContractManagementTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Dialog states
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<AdminContractResponse | null>(null);

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
    if (!params.has('sortBy')) {
      params.set('sortBy', 'createdAt');
      changed = true;
    }
    if (!params.has('sortDir')) {
      params.set('sortDir', 'desc');
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

  const isFeePaid = useMemo(() => {
    const val = searchParams.get('isFeePaid');
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, [searchParams]);

  const sortBy = useMemo(() => {
    return searchParams.get('sortBy') || 'createdAt';
  }, [searchParams]);

  const sortDir = useMemo(() => {
    return searchParams.get('sortDir') || 'desc';
  }, [searchParams]);

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
    if (!params.has('sortBy')) params.set('sortBy', sortBy);
    if (!params.has('sortDir')) params.set('sortDir', sortDir);

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

  const isKetKyActive = statusSelected.has('PENDING_SIGNATURE') && sortBy === 'createdAt' && sortDir === 'asc';

  const handleToggleKetKy = () => {
    if (isKetKyActive) {
      updateQuery({
        status: null,
        sortBy: 'createdAt',
        sortDir: 'desc',
        page: 1,
      });
    } else {
      updateQuery({
        status: 'PENDING_SIGNATURE',
        sortBy: 'createdAt',
        sortDir: 'asc',
        page: 1,
      });
    }
  };

  const filters: AdminContractFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      keyword: debouncedSearch || undefined,
      status: statusSelected.size > 0 ? (Array.from(statusSelected)[0] as AdminContractStatus) : undefined,
      isFeePaid,
      sortBy,
      sortDir,
    }),
    [page, pageSize, debouncedSearch, statusSelected, isFeePaid, sortBy, sortDir]
  );

  const { data: response, isLoading } = useQuery(adminContractsQueryOptions(filters));
  const { content = [], totalPages = 0, totalElements = 0 } = response?.data || {};

  // Confirm Payment Mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: confirmContractPayment,
    onSuccess: (res) => {
      toast.success(res.message || 'Xác nhận đã thu phí hợp đồng thành công.');
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi xác nhận đóng phí.');
    },
  });

  const handleConfirmPayment = (contract: AdminContractResponse) => {
    if (confirm(`Bạn có chắc chắn muốn xác nhận đã thu phí nhận lớp cho hợp đồng ${contract.contractNumber}?`)) {
      confirmPaymentMutation.mutate(contract.id);
    }
  };

  // CSV Exporter client-side
  const exportToCsv = (data: AdminContractResponse[]) => {
    const headers = [
      'Mã hợp đồng',
      'Mã lớp',
      'Môn học',
      'Gia sư',
      'SĐT Gia sư',
      'Email Gia sư',
      'Phụ huynh',
      'SĐT Phụ huynh',
      'Phí nhận lớp',
      'Trạng thái phí',
      'Ngày đóng phí',
      'Trạng thái hợp đồng',
      'Ngày ký',
      'Ngày tạo'
    ];

    const rows = data.map((contract) => [
      contract.contractNumber,
      contract.classCode || '',
      contract.subjectName || '',
      contract.tutorName || '',
      contract.tutorPhone || '',
      contract.tutorEmail || '',
      contract.contactName || '',
      contract.contactPhone || '',
      contract.introductionFee,
      contract.isFeePaid ? 'Đã đóng phí' : 'Chưa đóng phí',
      contract.paidAt ? new Date(contract.paidAt).toLocaleString('vi-VN') : '',
      contract.status,
      contract.signedAt ? new Date(contract.signedAt).toLocaleString('vi-VN') : '',
      new Date(contract.createdAt).toLocaleString('vi-VN')
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
    link.setAttribute('download', `Doi_Soat_Doanh_Thu_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const activeStatus = statusSelected.size > 0 ? (Array.from(statusSelected)[0] as AdminContractStatus) : undefined;
      const res = await getContractsForExport(activeStatus, isFeePaid);
      if (res.data && res.data.length > 0) {
        exportToCsv(res.data);
        toast.success(`Đã xuất thành công ${res.data.length} hợp đồng đối soát.`);
      } else {
        toast.warning('Không có dữ liệu hợp đồng thỏa mãn để xuất.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xuất file đối soát doanh thu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép: ${text}`);
  };

  const isFiltered = statusSelected.size > 0 || search || isFeePaid !== undefined;

  const resetFilters = () => {
    setSearch('');
    updateQuery({
      keyword: null,
      status: null,
      isFeePaid: null,
      sortBy: 'createdAt',
      sortDir: 'desc',
      page: 1,
    });
  };

  const safePage = Math.min(Math.max(page, 1), totalPages || 1);
  const pageCount = totalPages || 1;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* ─── Search & Filters ─── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Tìm theo mã hợp đồng, mã lớp, tên/SĐT gia sư, phụ huynh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 shrink-0">
              {/* Thúc đẩy tiến độ shortcut */}
              <Button
                variant={isKetKyActive ? 'default' : 'outline'}
                onClick={handleToggleKetKy}
                className={cn('gap-2 text-xs font-semibold cursor-pointer h-9', isKetKyActive && 'bg-amber-600 hover:bg-amber-700 text-white border-0')}
              >
                <PhoneCall className="h-4 w-4" />
                Thúc đẩy kẹt ký {isKetKyActive && <span className="ml-1 text-[10px] bg-white text-amber-700 px-1.5 py-0.2 rounded-full">ON</span>}
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
                Xuất file đối soát
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status facet filter */}
            <FacetFilter
              title="Trạng thái hợp đồng"
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

            {/* Payment status filter */}
            <Select
              value={isFeePaid === undefined ? 'ALL' : String(isFeePaid)}
              onValueChange={(val) => {
                const mapVal = val === 'ALL' ? null : val;
                updateQuery({ isFeePaid: mapVal, page: 1 });
              }}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Trạng thái thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Tất cả trạng thái phí</SelectItem>
                <SelectItem value="true" className="text-xs">Đã thu phí (PAID)</SelectItem>
                <SelectItem value="false" className="text-xs">Chưa thu phí (UNPAID)</SelectItem>
              </SelectContent>
            </Select>

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
                <TableHead className="w-[120px]">Hợp đồng / Lớp</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Gia sư (Bên B)</TableHead>
                <TableHead>Phụ huynh (Bên C)</TableHead>
                <TableHead>Phí nhận lớp</TableHead>
                <TableHead>Hạn / Trạng thái Phí</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right w-[150px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Đang tải danh sách hợp đồng...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground font-medium">
                    Không tìm thấy hợp đồng nào
                  </TableCell>
                </TableRow>
              ) : (
                content.map((contract) => {
                  const today = new Date();
                  const deadline = contract.feePaymentDeadline ? new Date(contract.feePaymentDeadline) : null;
                  const isOverdue = !contract.isFeePaid && deadline && deadline < today;

                  return (
                    <TableRow key={contract.id} className="hover:bg-muted/20 transition-colors">
                      {/* Hợp đồng / Lớp */}
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-bold text-foreground truncate max-w-[100px]">
                              {contract.contractNumber}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyText(contract.contractNumber)}
                            >
                              <Copy className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Lớp: {contract.classCode || 'N/A'}
                          </p>
                        </div>
                      </TableCell>

                      {/* Môn học */}
                      <TableCell className="align-top text-sm font-medium">
                        {contract.subjectName}
                      </TableCell>

                      {/* Gia sư */}
                      <TableCell className="align-top">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground">{contract.tutorName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{contract.tutorPhone}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{contract.tutorEmail}</p>
                        </div>
                      </TableCell>

                      {/* Phụ huynh */}
                      <TableCell className="align-top">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground">{contract.contactName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{contract.contactPhone}</p>
                        </div>
                      </TableCell>

                      {/* Phí nhận lớp */}
                      <TableCell className="align-top text-sm font-bold text-foreground">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                          contract.introductionFee
                        )}
                      </TableCell>

                      {/* Hạn / Trạng thái Phí */}
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          {contract.isFeePaid ? (
                            <div className="space-y-0.5">
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 border-0">
                                Đã đóng phí
                              </Badge>
                              {contract.paidAt && (
                                <p className="text-[9px] text-muted-foreground">
                                  {new Date(contract.paidAt).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className={cn(
                                'font-bold text-[9px] px-1.5 py-0.5 border',
                                isOverdue 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
                              )}>
                                {isOverdue ? 'Trễ hạn đóng' : 'Chưa đóng phí'}
                              </Badge>
                              {deadline && (
                                <p className={cn('text-[9px] font-mono', isOverdue ? 'text-rose-600 font-bold' : 'text-muted-foreground')}>
                                  Hạn: {deadline.toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Trạng thái hợp đồng */}
                      <TableCell className="align-top">
                        <StatusBadge status={contract.status} />
                      </TableCell>

                      {/* Thao tác */}
                      <TableCell className="text-right align-top">
                        <div className="flex gap-1.5 justify-end">
                          {/* Confirm Payment button */}
                          {!contract.isFeePaid && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold cursor-pointer text-emerald-600 border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleConfirmPayment(contract)}
                                  disabled={confirmPaymentMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="hidden md:inline ml-1.5">Thu phí</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xác nhận đã thu phí nhận lớp chuyển khoản thủ công</TooltipContent>
                            </Tooltip>
                          )}

                          {/* Dispute button (active, completed, violated, cancelled) */}
                          {['ACTIVE', 'PENDING_SIGNATURE', 'COMPLETED'].includes(contract.status) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 cursor-pointer text-rose-500 border-rose-100 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                                  onClick={() => {
                                    setSelectedContract(contract);
                                    setDisputeOpen(true);
                                  }}
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Can thiệp Sự cố / Tranh chấp</TooltipContent>
                            </Tooltip>
                          )}

                          {/* View PDF button */}
                          {contract.contractFileUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 cursor-pointer hover:bg-muted"
                                  onClick={() => window.open(contract.contractFileUrl, '_blank')}
                                >
                                  <FileText className="h-4 w-4 text-primary" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem Hợp đồng PDF</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto px-4 py-3 border-t sm:gap-8 bg-muted/20 rounded-xl border">
          <div className="text-muted-foreground text-sm font-medium whitespace-nowrap">
            Tổng cộng: <strong className="text-foreground">{totalElements}</strong> hợp đồng
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
                className="hidden size-8 lg:flex"
                onClick={() => goTo(1)}
                disabled={safePage <= 1}
              >
                <Icons.chevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang trước"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => goTo(safePage - 1)}
                disabled={safePage <= 1}
              >
                <Icons.chevronLeft className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang sau"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => goTo(safePage + 1)}
                disabled={safePage >= pageCount}
              >
                <Icons.chevronRight className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Trang cuối"
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => goTo(pageCount)}
                disabled={safePage >= pageCount}
              >
                <Icons.chevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Modals & Dialogs ─── */}
        <DisputeDialog
          open={disputeOpen}
          contract={selectedContract}
          onClose={() => {
            setDisputeOpen(false);
            setSelectedContract(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
          }}
        />
      </div>
    </TooltipProvider>
  );
}
