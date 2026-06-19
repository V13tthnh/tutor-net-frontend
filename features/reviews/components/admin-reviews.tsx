'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { adminReviewsPaginatedQueryOptions, reviewKeys } from '../api/queries';
import { toggleAdminReviewVisibility } from '../api/service';
import type { AdminReviewResponse, AdminReviewFilters } from '../api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatDateTime(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── FacetedFilter (identical pattern to TutorManagementTable) ───────────────
interface FacetedFilterProps {
  title: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}
function FacetedFilter({ title, options, selected, onToggle, onClear }: FacetedFilterProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed h-8">
          {selected.size > 0 ? (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="rounded-sm opacity-70 hover:opacity-100 cursor-pointer p-0.5 inline-flex items-center justify-center mr-1"
            >
              <Icons.xCircle className="h-3.5 w-3.5" />
            </span>
          ) : (
            <Icons.plusCircle className="mr-1.5 h-3.5 w-3.5" />
          )}
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.size}
              </Badge>
              <div className="hidden items-center gap-1 lg:flex">
                {selected.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.size} đã chọn
                  </Badge>
                ) : (
                  options
                    .filter((o) => selected.has(o.value))
                    .map((o) => (
                      <Badge key={o.value} variant="secondary" className="rounded-sm px-1 font-normal">
                        {o.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            <CommandGroup className="max-h-[260px] overflow-y-auto">
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => { onToggle(option.value); }}
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary' : 'opacity-50 [&_svg]:invisible'
                      )}
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

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icons.exclusive
            key={i}
            className={cn(
              'h-3.5 w-3.5 flex-shrink-0',
              i < rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted-foreground/20'
            )}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
        ({rating})
      </span>
    </div>
  );
}

// ─── TruncatedComment with native tooltip ─────────────────────────────────────
function TruncatedComment({ text, maxChars = 55 }: { text: string; maxChars?: number }) {
  const isTruncated = text.length > maxChars;
  const display = isTruncated ? text.slice(0, maxChars) + '…' : text;

  return (
    <span
      title={isTruncated ? text : undefined}
      className={cn(
        'text-xs text-foreground leading-relaxed',
        isTruncated && 'cursor-help underline decoration-dotted underline-offset-2'
      )}
    >
      {display}
    </span>
  );
}

// ─── VisibilityBadge ──────────────────────────────────────────────────────────
function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <Badge
      className={cn(
        'gap-1.5 py-1 px-2.5 font-semibold text-[11px] border whitespace-nowrap',
        isPublic
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
      )}
    >
      {isPublic ? (
        <>
          <Icons.eye className="h-3 w-3 flex-shrink-0" />
          Công khai
        </>
      ) : (
        <>
          <Icons.eyeOff className="h-3 w-3 flex-shrink-0" />
          Đã ẩn
        </>
      )}
    </Badge>
  );
}

// ─── Filter option constants ──────────────────────────────────────────────────
const RATING_FILTER_OPTIONS = [
  { value: '5', label: '⭐⭐⭐⭐⭐  5 sao' },
  { value: '4', label: '⭐⭐⭐⭐  4 sao' },
  { value: '3', label: '⭐⭐⭐  3 sao' },
  { value: '2', label: '⭐⭐  2 sao' },
  { value: '1', label: '⭐  1 sao' },
];

const VISIBILITY_FILTER_OPTIONS = [
  { value: 'true', label: 'Công khai' },
  { value: 'false', label: 'Đã ẩn' },
];

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ReviewDetailModal({
  review,
  onClose,
}: {
  review: AdminReviewResponse | null;
  onClose: () => void;
}) {
  if (!review) return null;

  return (
    <Dialog open={!!review} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-xl border bg-card p-0 gap-0 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Chi tiết đánh giá #{review.id}</DialogTitle>

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b bg-muted/30 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Icons.chat className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Chi tiết đánh giá</span>
            <span className="text-xs text-muted-foreground font-mono">#{review.id}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Stars */}
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} />
            <VisibilityBadge isPublic={review.isPublic} />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Hợp đồng</span>
              <span className="font-mono font-semibold text-primary">{review.contractNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Ngày đánh giá</span>
              <span className="font-medium">{formatDateTime(review.createdAt)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Gia sư</span>
              <span className="font-semibold">{review.tutorName}</span>
              <span className="block text-muted-foreground text-[10px]">{review.tutorEmail}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-0.5">Người đánh giá</span>
              {review.isGuestReview ? (
                <div className="flex flex-col">
                  <span className="text-xs italic text-muted-foreground">Khách vãng lai</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Magic Link</span>
                </div>
              ) : (
                <span className="font-semibold text-foreground">{review.reviewerName || '—'}</span>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Nội dung nhận xét</span>
            <p className="text-xs text-foreground bg-muted/20 p-3 rounded-lg border leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t bg-muted/20 rounded-b-xl flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Search (local state + debounce, synced with URL) ───────────────────────
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 500);
  const lastPushedSearchRef = useRef<string | null>(null);

  // ── URL updater ────────────────────────────────────────────────────────────
  const updateQuery = (updates: Record<string, string | number | null | string[]>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') {
        params.delete(k);
      } else if (Array.isArray(v)) {
        params.delete(k);
        v.forEach((val) => params.append(k, val));
      } else {
        params.set(k, String(v));
      }
    });

    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();
    if (newQueryString !== currentQueryString) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
  };

  // Sync search input to URL on debouncing
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (debouncedSearch !== urlSearch) {
      lastPushedSearchRef.current = debouncedSearch;
      updateQuery({
        search: debouncedSearch || null,
        page: 1,
      });
    }
  }, [debouncedSearch]);

  // Sync URL change back to search input (history navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== lastPushedSearchRef.current) {
      setSearch(urlSearch);
      lastPushedSearchRef.current = urlSearch;
    }
  }, [searchParams]);

  // ── Faceted filter state derived from URL (SSOT) ───────────────────────────
  const ratingSelected = useMemo(() => {
    const v = searchParams.get('rating');
    return v ? new Set([v]) : new Set<string>();
  }, [searchParams]);

  const visibilitySelected = useMemo(() => {
    const v = searchParams.get('isPublic');
    return v ? new Set([v]) : new Set<string>();
  }, [searchParams]);

  const urlPage = Math.max(1, Number(searchParams.get('page') || '1'));
  const urlSize = Number(searchParams.get('size') || '10');
  const pageSize = PAGE_SIZE_OPTIONS.includes(urlSize) ? urlSize : 10;

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleRatingToggle = (value: string) => {
    updateQuery({ rating: ratingSelected.has(value) ? null : value, page: 1 });
  };
  const handleRatingClear = () => updateQuery({ rating: null, page: 1 });

  const handleVisibilityToggle = (value: string) => {
    updateQuery({ isPublic: visibilitySelected.has(value) ? null : value, page: 1 });
  };
  const handleVisibilityClear = () => updateQuery({ isPublic: null, page: 1 });

  const isFiltered = search !== '' || ratingSelected.size > 0 || visibilitySelected.size > 0;

  const resetFilters = () => {
    setSearch('');
    updateQuery({
      search: null,
      rating: null,
      isPublic: null,
      page: 1,
    });
  };

  // ── Build API filters ──────────────────────────────────────────────────────
  const ratingVal = ratingSelected.size > 0 ? Number([...ratingSelected][0]) : undefined;
  const visibilityVal =
    visibilitySelected.size > 0 ? [...visibilitySelected][0] === 'true' : undefined;

  const filters: AdminReviewFilters = useMemo(
    () => ({
      page: urlPage,
      size: pageSize,
      rating: ratingVal,
      isPublic: visibilityVal,
      search: debouncedSearch || undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urlPage, pageSize, ratingVal, visibilityVal, debouncedSearch]
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: response, isLoading, isError, refetch } = useQuery(
    adminReviewsPaginatedQueryOptions(filters)
  );

  const { content: reviews = [], totalElements = 0, totalPages = 1 } =
    response?.data || {};

  const safePage = Math.min(Math.max(urlPage, 1), totalPages || 1);

  const goTo = (p: number) => {
    const targetPage = Math.max(1, Math.min(p, totalPages || 1));
    updateQuery({ page: targetPage });
  };

  // ── Toggle visibility mutation ─────────────────────────────────────────────
  const pendingToggleId = useRef<number | null>(null);
  const toggleMutation = useMutation({
    mutationFn: (id: number) => {
      pendingToggleId.current = id;
      return toggleAdminReviewVisibility(id);
    },
    onSuccess: () => {
      const review = reviews.find((r) => r.id === pendingToggleId.current);
      toast.success(
        review?.isPublic ? 'Đã ẩn đánh giá khỏi giao diện' : 'Đánh giá đã được hiện công khai'
      );
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái kiểm duyệt.');
    },
    onSettled: () => {
      pendingToggleId.current = null;
    },
  });

  // ── Detail modal ───────────────────────────────────────────────────────────
  const [detailReview, setDetailReview] = useState<AdminReviewResponse | null>(null);

  // ── Render states ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải danh sách đánh giá...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl bg-card p-8">
        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <Icons.warning size={24} />
        </div>
        <p className="font-bold text-base">Không thể tải dữ liệu</p>
        <p className="text-muted-foreground mt-1 text-sm max-w-sm">
          Có lỗi kết nối đến máy chủ. Vui lòng thử lại.
        </p>
        <Button variant="outline" className="mt-4 h-9 text-xs" onClick={() => refetch()}>
          Tải lại
        </Button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="space-y-4">
        {/* ── Table card (toolbar inside, identical to TutorManagementTable) ── */}
        <div className="rounded-xl border bg-card shadow-sm space-y-2">

          {/* Toolbar */}
          <div role="toolbar" className="flex w-full items-start justify-between gap-2 p-2 pb-0">
            <div className="flex flex-1 flex-wrap items-center gap-2">

              {/* Search */}
              <div className="relative">
                <Icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm gia sư, người đánh giá, mã HĐ..."
                  className="pl-9 h-8 w-44 lg:w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Faceted: Số sao */}
              <FacetedFilter
                title="Số sao"
                options={RATING_FILTER_OPTIONS}
                selected={ratingSelected}
                onToggle={handleRatingToggle}
                onClear={handleRatingClear}
              />

              {/* Faceted: Trạng thái */}
              <FacetedFilter
                title="Trạng thái"
                options={VISIBILITY_FILTER_OPTIONS}
                selected={visibilitySelected}
                onToggle={handleVisibilityToggle}
                onClear={handleVisibilityClear}
              />

              {/* Reset */}
              {isFiltered && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-dashed h-8"
                  onClick={resetFilters}
                >
                  <Cross2Icon className="mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* ── Table / Empty ──────────────────────────────────────────────── */}
          <div className="overflow-x-auto border-t">
            {totalElements === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                  <Icons.chat size={22} />
                </div>
                <p className="font-semibold text-sm">Không tìm thấy đánh giá nào</p>
                <p className="text-muted-foreground mt-1 text-xs max-w-xs">
                  Không có đánh giá nào phù hợp với bộ lọc hiện tại.
                </p>
                {isFiltered && (
                  <Button
                    onClick={resetFilters}
                    variant="link"
                    className="mt-2 text-xs text-primary font-bold"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <table className="w-full text-sm text-left border-collapse hidden md:table">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hợp đồng</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gia sư</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Người đánh giá</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-28">Số sao</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground max-w-[220px]">Nội dung</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày tạo</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reviews.map((review, idx) => (
                      <tr
                        key={review.id}
                        className="group transition-colors hover:bg-muted/30"
                        style={{
                          animation: `rowIn 300ms cubic-bezier(0.22,1,0.36,1) ${idx * 35}ms both`,
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {review.id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {review.contractNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground leading-tight">
                              {review.tutorName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {review.tutorEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {review.isGuestReview ? (
                            <div className="flex flex-col">
                              <span className="text-xs italic text-muted-foreground">Khách vãng lai</span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Magic Link</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-foreground">
                              {review.reviewerName || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StarRating rating={review.rating} />
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <TruncatedComment text={review.comment} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(review.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <VisibilityBadge isPublic={review.isPublic} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Detail */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Xem chi tiết"
                              onClick={() => setDetailReview(review)}
                            >
                              <Icons.eye size={15} />
                            </Button>

                            {/* Toggle visibility */}
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                'h-8 text-xs font-semibold px-3 gap-1',
                                review.isPublic
                                  ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
                                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950'
                              )}
                              onClick={() => toggleMutation.mutate(review.id)}
                              disabled={
                                toggleMutation.isPending &&
                                pendingToggleId.current === review.id
                              }
                            >
                              {toggleMutation.isPending &&
                              pendingToggleId.current === review.id ? (
                                <Icons.spinner className="h-3 w-3 animate-spin" />
                              ) : review.isPublic ? (
                                <>
                                  <Icons.eyeOff size={13} />
                                  Ẩn đi
                                </>
                              ) : (
                                <>
                                  <Icons.eye size={13} />
                                  Hiện lên
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {reviews.map((review, idx) => (
                    <div
                      key={review.id}
                      className="p-4 space-y-3"
                      style={{
                        animation: `rowIn 350ms cubic-bezier(0.22,1,0.36,1) ${idx * 40}ms both`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {review.contractNumber}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{review.id}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Gia sư:</span>
                          <span className="font-semibold text-foreground">{review.tutorName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Người đánh giá:</span>
                          <span className="font-medium text-foreground">
                            {review.isGuestReview ? 'Khách vãng lai' : (review.reviewerName || '—')}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Ngày đánh giá:</span>
                          <span>{formatDateTime(review.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <StarRating rating={review.rating} />
                        <VisibilityBadge isPublic={review.isPublic} />
                      </div>

                      {review.comment && (
                        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border">
                          <TruncatedComment text={review.comment} maxChars={80} />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-medium px-2.5 gap-1"
                          onClick={() => setDetailReview(review)}
                        >
                          <Icons.eye size={13} />
                          Chi tiết
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            'h-8 text-xs font-semibold px-3 gap-1',
                            review.isPublic
                              ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950'
                          )}
                          onClick={() => toggleMutation.mutate(review.id)}
                          disabled={
                            toggleMutation.isPending &&
                            pendingToggleId.current === review.id
                          }
                        >
                          {toggleMutation.isPending &&
                          pendingToggleId.current === review.id ? (
                            <Icons.spinner className="h-3 w-3 animate-spin" />
                          ) : review.isPublic ? (
                            <>
                              <Icons.eyeOff size={13} />
                              Ẩn đi
                            </>
                          ) : (
                            <>
                              <Icons.eye size={13} />
                              Hiện lên
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination footer */}
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
                        max={totalPages}
                        value={safePage}
                        onChange={(e) => goTo(Number(e.target.value))}
                        className="w-12 rounded-md border px-2 py-1 text-center text-sm bg-background h-8"
                      />
                      <span className="text-sm hidden sm:inline">/ {totalPages}</span>
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
                        disabled={safePage >= totalPages}
                      >
                        <Icons.chevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label="Trang cuối"
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => goTo(totalPages)}
                        disabled={safePage >= totalPages}
                      >
                        <Icons.chevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ReviewDetailModal review={detailReview} onClose={() => setDetailReview(null)} />
    </>
  );
}
