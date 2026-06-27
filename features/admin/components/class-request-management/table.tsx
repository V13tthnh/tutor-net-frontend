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
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminClassRequestsQueryOptions, classRequestFilterOptionsQueryOptions } from '../../api/queries';
import { reviewClassRequestMutation, bulkReviewClassRequestsMutation } from '../../api/mutations';
import { ClassRequestDetailModal } from './detail-modal';
import { ReviewDialog } from './review-dialog';
import { BulkReviewDialog } from './bulk-review-dialog';
import type { ClassRequestResponse, ClassRequestFilters } from '../../api/types';
import { TableForbiddenState } from '@/components/ui/table/table-forbidden-state';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const TEACHING_MODE_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Tại nhà' },
  { value: 'HYBRID', label: 'Kết hợp' },
];

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    PENDING: {
      label: 'Chờ duyệt',
      variant: 'outline',
      icon: Icons.clock,
    },
    APPROVED: {
      label: 'Đã duyệt',
      variant: 'default',
      icon: Icons.check,
    },
    REJECTED: {
      label: 'Từ chối',
      variant: 'destructive',
      icon: Icons.xCircle,
    },
    CANCELLED: {
      label: 'Hủy',
      variant: 'outline',
      icon: Icons.xCircle,
    },
  };

  const config = configs[status] || { label: status, variant: 'outline', icon: Icons.help };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

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
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
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
      <PopoverContent className="w-48 p-0" align="start">
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
                    onSelect={() => {
                      onToggle(option.value);
                    }}
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

export function ClassRequestManagementTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync / validate parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has('page')) {
      params.set('page', '1');
      changed = true;
    }
    if (!params.has('limit') && !params.has('size')) {
      params.set('limit', '10');
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

  // Get state from URL
  const [search, setSearch] = useState(() => searchParams.get('keyword') || '');
  const debouncedSearch = useDebounce(search, 500);

  const page = useMemo(() => {
    const urlPage = searchParams.get('page');
    const num = urlPage ? Number(urlPage) : 1;
    return isNaN(num) || num < 1 ? 1 : num;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const urlSize = searchParams.get('limit') || searchParams.get('size');
    const num = urlSize ? Number(urlSize) : 10;
    return isNaN(num) || num < 1 ? 10 : num;
  }, [searchParams]);

  const statusSelected = useMemo(() => {
    const status = searchParams.get('status');
    return status ? new Set([status]) : new Set<string>();
  }, [searchParams]);

  const subjectSelected = useMemo(() => {
    const subjectId = searchParams.get('subjectId');
    return subjectId ? new Set([Number(subjectId)]) : new Set<number>();
  }, [searchParams]);

  const teachingModeSelected = useMemo(() => {
    const teachingMode = searchParams.get('teachingMode');
    return teachingMode ? new Set([teachingMode]) : new Set<string>();
  }, [searchParams]);

  const sortBy = useMemo(() => {
    return searchParams.get('sortBy') || 'createdAt';
  }, [searchParams]);

  const sortDir = useMemo(() => {
    return searchParams.get('sortDir') || 'desc';
  }, [searchParams]);

  // Modals & dialogs
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClassRequestResponse | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  // Bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkReviewOpen, setBulkReviewOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

  const { data: filterOptions } = useQuery(classRequestFilterOptionsQueryOptions());

  // Helper to update query params
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      const actualKey = key === 'size' ? 'limit' : key;
      if (value === null || value === undefined || value === '') {
        params.delete(actualKey);
      } else {
        params.set(actualKey, String(value));
      }
    });

    if (!params.has('page')) params.set('page', String(page));
    if (!params.has('limit')) params.set('limit', String(pageSize));
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

  const filters: ClassRequestFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      keyword: debouncedSearch || undefined,
      status: statusSelected.size > 0 ? Array.from(statusSelected)[0] : undefined,
      subjectId: subjectSelected.size > 0 ? Array.from(subjectSelected)[0] : undefined,
      teachingMode: teachingModeSelected.size > 0 ? Array.from(teachingModeSelected)[0] : undefined,
      sortBy,
      sortDir,
    }),
    [page, pageSize, debouncedSearch, statusSelected, subjectSelected, teachingModeSelected, sortBy, sortDir]
  );

  const { data: response, isLoading, isError } = useQuery(adminClassRequestsQueryOptions(filters));

  const { content = [], totalPages = 0, totalElements = 0 } = response?.data || {};

  const subjectOptions = useMemo(
    () =>
      filterOptions?.subjects?.map((s) => ({
        value: String(s.id),
        label: s.name,
      })) || [],
    [filterOptions?.subjects]
  );

  const isFiltered = statusSelected.size > 0 || subjectSelected.size > 0 || teachingModeSelected.size > 0 || search;

  // Bulk review mutation
  const bulkReviewMutation = useMutation(bulkReviewClassRequestsMutation);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(content.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkReviewSubmit = async (action: 'approve' | 'reject', reason?: string) => {
    if (selectedIds.size === 0) return;

    try {
      await bulkReviewMutation.mutateAsync({
        ids: Array.from(selectedIds),
        data: {
          status: (action === 'approve' ? 'APPROVED' : 'REJECTED') as any,
          rejectionReason: action === 'reject' ? reason : undefined,
        },
      });

      toast.success(`Xử lý hàng loạt thành công (${selectedIds.size} yêu cầu)`);
      setSelectedIds(new Set());
      setBulkReviewOpen(false);
      updateQuery({ page: 1 });
    } catch (error) {
      toast.error('Lỗi khi xử lý hàng loạt');
    }
  };

  const safePage = Math.min(Math.max(page, 1), totalPages || 1);
  const pageCount = totalPages || 1;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="flex-1"
            />
            {isLoading && search !== debouncedSearch && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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

            <FacetFilter
              title="Môn học"
              options={subjectOptions}
              selected={subjectSelected.size > 0 ? new Set(Array.from(subjectSelected).map(String)) : new Set()}
              onToggle={(value) => {
                const newSubjectId = subjectSelected.has(Number(value)) ? null : value;
                updateQuery({ subjectId: newSubjectId, page: 1 });
              }}
              onClear={() => {
                updateQuery({ subjectId: null, page: 1 });
              }}
            />

            <FacetFilter
              title="Hình thức"
              options={TEACHING_MODE_OPTIONS}
              selected={teachingModeSelected}
              onToggle={(value) => {
                const newMode = teachingModeSelected.has(value) ? null : value;
                updateQuery({ teachingMode: newMode, page: 1 });
              }}
              onClear={() => {
                updateQuery({ teachingMode: null, page: 1 });
              }}
            />

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  updateQuery({
                    keyword: null,
                    status: null,
                    subjectId: null,
                    teachingMode: null,
                    page: 1,
                  });
                }}
              >
                <Cross2Icon className="mr-1.5 h-3.5 w-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <Badge variant="secondary">{selectedIds.size} yêu cầu đã chọn</Badge>
            <div className="flex-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setBulkAction('approve');
                    setBulkReviewOpen(true);
                  }}
                  disabled={bulkReviewMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Phê duyệt hàng loạt
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phê duyệt {selectedIds.size} yêu cầu</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setBulkAction('reject');
                    setBulkReviewOpen(true);
                  }}
                  disabled={bulkReviewMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Từ chối hàng loạt
                </Button>
              </TooltipTrigger>
              <TooltipContent>Từ chối {selectedIds.size} yêu cầu</TooltipContent>
            </Tooltip>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === content.length && content.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Khối lớp</TableHead>
                <TableHead>Hình thức</TableHead>
                <TableHead>Học phí</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableForbiddenState colSpan={10} />
              ) : content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy yêu cầu lớp học
                  </TableCell>
                </TableRow>
              ) : (
                content.map((request) => (
                  <TableRow key={request.id} className={selectedIds.has(request.id) ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={(checked) => handleSelectRow(request.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.contactName}</p>
                        <p className="text-xs text-muted-foreground">{request.contactPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{request.subjectName}</TableCell>
                    <TableCell>{request.gradeLevel}</TableCell>
                    <TableCell>
                      {request.teachingMode === 'ONLINE' && 'Online'}
                      {request.teachingMode === 'OFFLINE' && 'Tại nhà'}
                      {request.teachingMode === 'HYBRID' && 'Kết hợp'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(request.proposedPrice as number).toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                router.push(`/admin/class-requests/${request.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết</TooltipContent>
                        </Tooltip>

                        {request.status === 'PENDING' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewAction('approve');
                                    setReviewOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Phê duyệt</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewAction('reject');
                                    setReviewOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Từ chối</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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

        {/* Modals & Dialogs */}
        <ClassRequestDetailModal
          request={selectedRequest}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedRequest(null);
          }}
        />

        <ReviewDialog
          open={reviewOpen}
          request={selectedRequest}
          action={reviewAction}
          onClose={() => {
            setReviewOpen(false);
            setSelectedRequest(null);
            setReviewAction(null);
          }}
          onSuccess={() => {
            updateQuery({ page: 1 });
          }}
        />

        <BulkReviewDialog
          open={bulkReviewOpen}
          count={selectedIds.size}
          action={bulkAction}
          onClose={() => {
            setBulkReviewOpen(false);
            setBulkAction(null);
          }}
          onSubmit={handleBulkReviewSubmit}
          isLoading={bulkReviewMutation.isPending}
        />
      </div>
    </TooltipProvider>
  );
}
