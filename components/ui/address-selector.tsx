'use client';

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Province {
  name: string;
  code: number;
}

interface Ward {
  name: string;
  code: number;
}

// ─── SearchableSelect (nội bộ) ─────────────────────────────────────────────────
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Chọn...',
  emptyMessage = 'Không tìm thấy kết quả.',
  disabled = false,
  loading = false,
  id
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full h-9 justify-between font-normal bg-background border-input text-left'
          disabled={disabled || loading}
        >
          <span className='line-clamp-1 text-sm'>
            {loading
              ? 'Đang tải...'
              : (selected?.label ?? <span className='text-muted-foreground'>{placeholder}</span>)}
          </span>
          {loading ? (
            <Icons.spinner className='ml-2 h-4 w-4 shrink-0 animate-spin opacity-50' />
          ) : (
            <Icons.chevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Tìm kiếm...' className='h-9' />
          <CommandList className='max-h-[220px] overflow-y-auto'>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label} // Dùng label để tìm kiếm tiếng Việt chính xác
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className='text-xs cursor-pointer'
                >
                  <Icons.check
                    className={cn(
                      'mr-2 h-3.5 w-3.5 text-primary',
                      value === opt.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── AddressSelector Props ─────────────────────────────────────────────────────
export interface AddressSelectorValue {
  /** Tên tỉnh/thành phố (gửi lên server) */
  province: string;
  /** Tên phường/xã (gửi lên server) */
  ward: string;
}

interface AddressSelectorProps {
  /** Giá trị hiện tại */
  value: AddressSelectorValue;
  /** Callback khi tỉnh hoặc xã thay đổi */
  onChange: (val: AddressSelectorValue) => void;
  /** Disable toàn bộ selector */
  disabled?: boolean;
  /** Class bọc ngoài grid */
  className?: string;
}

// ─── AddressSelector (export chính) ───────────────────────────────────────────
/**
 * Component chọn Tỉnh/Thành phố + Phường/Xã từ provinces.open-api.vn
 * - Khi chọn tỉnh mới, tự động load danh sách phường/xã và reset ward
 * - Giá trị trả về là tên (string) để gửi lên server
 * - Nếu đã có `value.province` sẵn, tự động match với danh sách và pre-load ward list
 */
export function AddressSelector({
  value,
  onChange,
  disabled = false,
  className
}: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // provinceCode: dùng nội bộ để fetch wards
  const [provinceCode, setProvinceCode] = useState<string>('');

  // ── Fetch danh sách tỉnh khi mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch('/api/provinces');
        if (res.ok) {
          const data: Province[] = await res.json();
          const list = Array.isArray(data) ? data : [];
          setProvinces(list);

          // Nếu đã có province name sẵn → match để lấy code và tự động load wards
          if (value.province && list.length > 0) {
            const matched = list.find(
              (p) =>
                p.name === value.province ||
                p.name.toLowerCase().includes(value.province.toLowerCase()) ||
                value.province.toLowerCase().includes(p.name.toLowerCase())
            );
            if (matched) {
              setProvinceCode(matched.code.toString());
            }
          }
        }
      } catch (err) {
        console.error('AddressSelector: Error fetching provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
    // Chỉ chạy 1 lần khi mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch wards khi provinceCode thay đổi ────────────────────────────────────
  useEffect(() => {
    if (!provinceCode) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(
          `/api/provinces?code=${provinceCode}`
        );
        if (res.ok) {
          const data = await res.json();
          const rawWards = data.districts || data.wards || [];
          const list: Ward[] = Array.isArray(rawWards) ? rawWards : [];
          setWards(list);

          // Nếu đã có ward name sẵn → giữ nguyên (không reset khi pre-loading)
        }
      } catch (err) {
        console.error('AddressSelector: Error fetching wards:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [provinceCode]);

  // ── Handler: chọn tỉnh ───────────────────────────────────────────────────────
  const handleProvinceChange = useCallback(
    (code: string) => {
      const name = provinces.find((p) => p.code.toString() === code)?.name || '';
      setProvinceCode(code);
      setWards([]); // reset wards list
      onChange({ province: name, ward: '' }); // reset ward value
    },
    [provinces, onChange]
  );

  // ── Handler: chọn phường/xã ──────────────────────────────────────────────────
  const handleWardChange = useCallback(
    (code: string) => {
      const name = wards.find((w) => w.code.toString() === code)?.name || '';
      onChange({ province: value.province, ward: name });
    },
    [wards, value.province, onChange]
  );

  // Tìm code từ tên để hiển thị đúng giá trị đang chọn
  const selectedProvinceCode =
    provinceCode ||
    provinces.find((p) => p.name === value.province)?.code.toString() ||
    '';

  const selectedWardCode =
    wards.find((w) => w.name === value.ward)?.code.toString() || '';

  const provinceOptions = provinces.map((p) => ({
    value: p.code.toString(),
    label: p.name
  }));

  const wardOptions = wards.map((w) => ({
    value: w.code.toString(),
    label: w.name
  }));

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {/* Tỉnh/Thành phố */}
      <div className='grid gap-1'>
        <label
          htmlFor='address-province'
          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          Tỉnh/Thành phố{' '}
          <span className='text-destructive ml-0.5' aria-hidden>*</span>
        </label>
        <SearchableSelect
          id='address-province'
          value={selectedProvinceCode}
          onValueChange={handleProvinceChange}
          options={provinceOptions}
          placeholder='Tìm và chọn Tỉnh/Thành phố'
          emptyMessage='Không tìm thấy tỉnh/thành.'
          disabled={disabled}
          loading={loadingProvinces}
        />
      </div>

      {/* Phường/Xã */}
      <div className='grid gap-1'>
        <label
          htmlFor='address-ward'
          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center justify-between'
        >
          <span>
            Phường/Xã{' '}
            <span className='text-destructive ml-0.5' aria-hidden>*</span>
          </span>
          {loadingWards && (
            <span className='flex items-center gap-1 text-[10px] text-primary animate-pulse font-normal'>
              <Icons.spinner className='h-2.5 w-2.5 animate-spin' />
              Đang tải...
            </span>
          )}
        </label>
        <SearchableSelect
          id='address-ward'
          value={selectedWardCode}
          onValueChange={handleWardChange}
          options={wardOptions}
          placeholder={!selectedProvinceCode ? 'Chọn tỉnh trước' : 'Tìm và chọn Phường/Xã'}
          emptyMessage='Không tìm thấy phường/xã.'
          disabled={disabled || !selectedProvinceCode}
          loading={loadingWards}
        />
      </div>
    </div>
  );
}
