'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Loader2, Download } from 'lucide-react';
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

// ─── Facet Filter Component ──────────────────────────────────────────────────

interface FacetFilterProps {
  title: string;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FacetFilter({
  title,
  options,
  selected,
  onToggle,
  onClear,
}: FacetFilterProps) {
  const [open, setOpen] = React.useState(false);

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

interface ContractTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  debouncedSearch: string;
  isExporting: boolean;
  onExport: () => void;
  statusSelected: Set<string>;
  onStatusToggle: (value: string) => void;
  onStatusClear: () => void;
  isFeePaid: boolean | undefined;
  onFeePaidChange: (value: string) => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function ContractTableToolbar({
  search,
  onSearchChange,
  isLoading,
  debouncedSearch,
  isExporting,
  onExport,
  statusSelected,
  onStatusToggle,
  onStatusClear,
  isFeePaid,
  onFeePaidChange,
  isFiltered,
  onResetFilters,
}: ContractTableToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative flex items-center">
          <Input
            placeholder="Tìm theo mã hợp đồng, mã lớp, tên/SĐT gia sư, phụ huynh..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1"
          />
          {isLoading && search !== debouncedSearch && (
            <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={onExport}
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
          onToggle={onStatusToggle}
          onClear={onStatusClear}
        />

        {/* Payment status filter */}
        <Select
          value={isFeePaid === undefined ? 'ALL' : String(isFeePaid)}
          onValueChange={onFeePaidChange}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs cursor-pointer">
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
            onClick={onResetFilters}
            className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Cross2Icon className="mr-1 h-3 w-3" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
