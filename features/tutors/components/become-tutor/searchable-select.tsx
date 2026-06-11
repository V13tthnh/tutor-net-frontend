'use client';

import React, { useState } from 'react';
import { IconChevronRight, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

function SearchableSelectComponent({
  value,
  onValueChange,
  options,
  placeholder = 'Chọn...',
  emptyMessage = 'Không tìm thấy kết quả.',
  disabled = false
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full h-10 justify-between font-normal bg-background border-input text-left'
          disabled={disabled}
        >
          <span className='line-clamp-1'>{selected?.label ?? placeholder}</span>
          <IconChevronRight size={16} className='ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90' />
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
                  value={opt.label}
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className='text-xs cursor-pointer'
                >
                  <IconCheck
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

export const SearchableSelect = React.memo(SearchableSelectComponent);
