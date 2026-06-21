'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminContractsQueryOptions } from '../../api/queries';
import { confirmContractPayment, getContractsForExport } from '../../api/service';
import { DisputeDialog } from './dispute-dialog';
import type { AdminContractResponse, AdminContractFilters, AdminContractStatus } from '../../api/types';
import { ContractTableToolbar } from './contract-table-toolbar';
import { ContractTableRow } from './contract-table-row';
import { ContractTablePagination } from './contract-table-pagination';

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const activeStatus = statusSelected.size > 0 ? (Array.from(statusSelected)[0] as AdminContractStatus) : undefined;
      const blob = await getContractsForExport(activeStatus, isFeePaid);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Doi_Soat_Doanh_Thu_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Đã xuất file đối soát thành công');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xuất file đối soát doanh thu');
    } finally {
      setIsExporting(false);
    }
  };

  const isFiltered = statusSelected.size > 0 || !!search || isFeePaid !== undefined;

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
        {/* Toolbar Component */}
        <ContractTableToolbar
          search={search}
          onSearchChange={setSearch}
          isLoading={isLoading}
          debouncedSearch={debouncedSearch}
          isKetKyActive={isKetKyActive}
          onToggleKetKy={handleToggleKetKy}
          isExporting={isExporting}
          onExport={handleExport}
          statusSelected={statusSelected}
          onStatusToggle={(value) => {
            const newStatus = statusSelected.has(value) ? null : value;
            updateQuery({ status: newStatus, page: 1 });
          }}
          onStatusClear={() => {
            updateQuery({ status: null, page: 1 });
          }}
          isFeePaid={isFeePaid}
          onFeePaidChange={(val) => {
            const mapVal = val === 'ALL' ? null : val;
            updateQuery({ isFeePaid: mapVal, page: 1 });
          }}
          isFiltered={isFiltered}
          onResetFilters={resetFilters}
        />

        {/* Table layout */}
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
                content.map((contract) => (
                  <ContractTableRow
                    key={contract.id}
                    contract={contract}
                    onConfirmPayment={handleConfirmPayment}
                    onDisputeClick={(c) => {
                      setSelectedContract(c);
                      setDisputeOpen(true);
                    }}
                    isPaymentPending={confirmPaymentMutation.isPending}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Component */}
        <ContractTablePagination
          totalElements={totalElements}
          pageSize={pageSize}
          pageCount={pageCount}
          safePage={safePage}
          onPageSizeChange={(size) => updateQuery({ size, page: 1 })}
          onPageChange={goTo}
        />

        {/* Dispute dialog */}
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
