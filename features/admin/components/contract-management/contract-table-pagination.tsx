'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

interface ContractTablePaginationProps {
  totalElements: number;
  pageSize: number;
  pageCount: number;
  safePage: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
}

export function ContractTablePagination({
  totalElements,
  pageSize,
  pageCount,
  safePage,
  onPageSizeChange,
  onPageChange,
}: ContractTablePaginationProps) {
  return (
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
            onValueChange={(v) => onPageSizeChange(Number(v))}
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
            onChange={(e) => onPageChange(Number(e.target.value))}
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
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1}
          >
            <Icons.chevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Trang trước"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
          >
            <Icons.chevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Trang sau"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= pageCount}
          >
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Trang cuối"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(pageCount)}
            disabled={safePage >= pageCount}
          >
            <Icons.chevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
