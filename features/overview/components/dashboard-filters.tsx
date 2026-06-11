'use client';

import { useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

const ranges = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Tuần này', value: 'week' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay', value: 'year' },
];

export function DashboardFilters() {
  const [range, setRange] = useQueryState('range', { defaultValue: 'month' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center rounded-md border p-1 bg-muted/20'>
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => {
              setRange(r.value);
              setDateRange(undefined);
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
              range === r.value && !dateRange
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Lọc theo ngày cụ thể */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'gap-2 hidden sm:flex',
              dateRange && 'border-primary text-primary'
            )}
          >
            <Icons.calendar className='size-4' />
            {dateRange?.from ? (
              dateRange.to ? (
                `${dateRange.from.toLocaleDateString('vi-VN')} - ${dateRange.to.toLocaleDateString('vi-VN')}`
              ) : (
                dateRange.from.toLocaleDateString('vi-VN')
              )
            ) : (
              'Tuỳ chỉnh'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='end'>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => {
              setDateRange(range);
              setRange('custom'); // Set URL to custom range mode
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
