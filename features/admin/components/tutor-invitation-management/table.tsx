'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Loader2, Eye, Ban, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminTutorInvitationsQueryOptions } from '../../api/queries';
import { TutorInvitationDetailModal } from './detail-modal';
import { CancelInvitationDialog } from './cancel-dialog';
import type { AdminTutorInvitationTableResponse, TutorInvitationFilters, InvitationStatus } from '../../api/types';
import { TableForbiddenState } from '@/components/ui/table/table-forbidden-state';

import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'ACCEPTED', label: 'Đã nhận' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELED_BY_ADMIN', label: 'Đã hủy (Admin)' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvitationStatus | string }) {
  const configs: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: 'Đang chờ',
      className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700',
    },
    ACCEPTED: {
      label: 'Đã nhận',
      className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700',
    },
    REJECTED: {
      label: 'Từ chối',
      className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700',
    },
    CANCELED_BY_ADMIN: {
      label: 'Đã hủy (Admin)',
      className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600',
    },
  };

  const cfg = configs[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ─── Facet Filter ─────────────────────────────────────────────────────────────

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
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Icons.plusCircle className="mr-1.5 h-3.5 w-3.5" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
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
                  >
                    <div
                      className={`border-primary flex size-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'}`}
                    >
                      <CheckIcon />
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
                  <CommandItem onSelect={onClear} className="justify-center text-center">
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

// Helper to format Date to YYYY-MM-DD local string
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Date Range Filter Component ─────────────────────────────────────────────

function DateRangeFilter({
  startDate,
  endDate,
  onRangeChange,
}: {
  startDate: string;
  endDate: string;
  onRangeChange: (range: DateRange | undefined) => void;
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 justify-start text-left font-normal border-dashed',
                (!startDate && !endDate) && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              {startDate ? (
                endDate ? (
                  <>
                    {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
                  </>
                ) : (
                  <span>Từ {format(new Date(startDate), 'dd/MM/yyyy')}</span>
                )
              ) : (
                <span>Từ ngày — Đến ngày</span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          Lọc theo ngày tạo: Từ ngày — Đến ngày
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
          }}
          onSelect={onRangeChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Table Component ─────────────────────────────────────────────────────

export function TutorInvitationManagementTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL parameters synchronization on mount / update
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has('page')) {
      params.set('page', '1');
      changed = true;
    }
    if (!params.has('size') && !params.has('limit')) {
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

  // Derived states from URL (searchParams is the single source of truth)
  const page = useMemo(() => {
    const urlPage = searchParams.get('page');
    const num = urlPage ? Number(urlPage) : 1;
    return isNaN(num) || num < 1 ? 1 : num;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const urlSize = searchParams.get('size') || searchParams.get('limit');
    const num = urlSize ? Number(urlSize) : 10;
    return isNaN(num) || num < 1 ? 10 : num;
  }, [searchParams]);

  const statusSelected = useMemo(() => {
    const status = searchParams.get('status');
    return status ? new Set([status]) : new Set<string>();
  }, [searchParams]);

  const startDate = useMemo(() => {
    return searchParams.get('startDate') || '';
  }, [searchParams]);

  const endDate = useMemo(() => {
    return searchParams.get('endDate') || '';
  }, [searchParams]);

  const sortBy = useMemo(() => {
    return searchParams.get('sortBy') || 'createdAt';
  }, [searchParams]);

  const sortDir = useMemo(() => {
    return searchParams.get('sortDir') || 'desc';
  }, [searchParams]);

  // Search local state for responsive typing, debounced to update the URL
  const [search, setSearch] = useState(() => searchParams.get('keyword') || '');
  const debouncedSearch = useDebounce(search, 500);

  // Modal / dialog state
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<AdminTutorInvitationTableResponse | null>(null);

  // Helper: update URL query params
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      // Map limit to size for URL structure
      const actualKey = key === 'limit' ? 'size' : key;
      if (value === null || value === undefined || value === '') {
        params.delete(actualKey);
      } else {
        params.set(actualKey, String(value));
      }
    });

    // Ensure we keep the standard page, size, sortBy, sortDir
    if (!params.has('page')) params.set('page', String(page));
    if (!params.has('size')) params.set('size', String(pageSize));
    if (!params.has('sortBy')) params.set('sortBy', sortBy);
    if (!params.has('sortDir')) params.set('sortDir', sortDir);

    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync search input with URL keyword parameter (e.g. for reset or browser back/forward navigation)
  useEffect(() => {
    const urlKeyword = searchParams.get('keyword') || '';
    if (urlKeyword !== search) {
      setSearch(urlKeyword);
    }
  }, [searchParams]);

  // Sync debounced search to URL
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

  // Build filters for query
  const filters: TutorInvitationFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      keyword: debouncedSearch || undefined,
      status: statusSelected.size > 0 ? Array.from(statusSelected)[0] : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
      sortBy,
      sortDir,
    }),
    [page, pageSize, debouncedSearch, statusSelected, startDate, endDate, sortBy, sortDir]
  );

  const { data: response, isLoading, isError } = useQuery(adminTutorInvitationsQueryOptions(filters));

  const { content = [], totalPages = 0, totalElements = 0 } = response?.data || {};

  const isFiltered = statusSelected.size > 0 || search || startDate || endDate;

  const resetFilters = () => {
    setSearch('');
    updateQuery({
      keyword: null,
      status: null,
      startDate: null,
      endDate: null,
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
          <div className="flex gap-2">
            <Input
              placeholder="Tìm theo tên gia sư, phụ huynh, SĐT, mã lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            {isLoading && search !== debouncedSearch && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status facet filter */}
            <FacetFilter
              title="Trạng thái"
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

            {/* Date range filter */}
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(range) => {
                const startStr = range?.from ? formatDateToString(range.from) : null;
                const endStr = range?.to ? formatDateToString(range.to) : null;
                updateQuery({
                  startDate: startStr,
                  endDate: endStr,
                  page: 1,
                });
              }}
            />

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                <Cross2Icon className="mr-1.5 h-3.5 w-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID / Ngày</TableHead>
                <TableHead>Lớp học</TableHead>
                <TableHead>Người gửi (Phụ huynh)</TableHead>
                <TableHead>Người nhận (Gia sư)</TableHead>
                <TableHead className="max-w-[180px]">Lời nhắn</TableHead>
                <TableHead>Học phí đề xuất</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableForbiddenState colSpan={8} />
              ) : content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Không tìm thấy lời mời nào
                  </TableCell>
                </TableRow>
              ) : (
                content.map((inv) => (
                  <TableRow key={inv.id}>
                    {/* ID / Ngày */}
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">#{inv.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </TableCell>

                    {/* Lớp học */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm font-mono">{inv.classCode || '—'}</p>
                        <p className="text-xs text-muted-foreground">{inv.subjectName}</p>
                      </div>
                    </TableCell>

                    {/* Người gửi */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.studentName}</p>
                        <p className="text-xs text-muted-foreground">{inv.studentPhone || '—'}</p>
                      </div>
                    </TableCell>

                    {/* Người nhận */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.tutorName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {inv.tutorId ? `ID: ${inv.tutorId}` : '—'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Lời nhắn (truncate + tooltip) */}
                    <TableCell className="max-w-[180px]">
                      {inv.message ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground line-clamp-1 cursor-help">
                              {inv.message}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {inv.message}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Không có</span>
                      )}
                    </TableCell>

                    {/* Học phí */}
                    <TableCell className="text-sm font-medium">
                      {inv.proposedPrice != null
                        ? new Intl.NumberFormat('vi-VN').format(inv.proposedPrice) + 'đ'
                        : '—'}
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {/* Xem chi tiết */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedInvitation(inv);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết</TooltipContent>
                        </Tooltip>

                        {/* Hủy lời mời (chỉ khi PENDING) */}
                        {inv.status === 'PENDING' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedInvitation(inv);
                                  setCancelOpen(true);
                                }}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hủy lời mời</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 overflow-auto px-4 py-3 border-t sm:gap-8">
          <div className="text-muted-foreground text-sm whitespace-nowrap">
            {totalElements} kết quả
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
                className="w-14 rounded-md border px-2 py-1 text-center text-sm bg-background"
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
        <TutorInvitationDetailModal
          invitation={selectedInvitation}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
          }}
          onCancel={() => {
            setCancelOpen(true);
          }}
        />

        <CancelInvitationDialog
          open={cancelOpen}
          invitation={selectedInvitation}
          onClose={() => {
            setCancelOpen(false);
            setSelectedInvitation(null);
          }}
          onSuccess={() => {
            updateQuery({ page: 1 });
          }}
        />
      </div>
    </TooltipProvider>
  );
}
