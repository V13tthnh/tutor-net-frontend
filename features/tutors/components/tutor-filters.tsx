'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQueryState } from 'nuqs';
import { tutorSearchParams } from '../lib/search-params';
import { IconSearch, IconX, IconFilter, IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tutorFilterOptionsQuery } from '../api/queries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterOption {
  value: string;
  label: string;
}

function MultiSelectFilter({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='text-foreground text-sm font-semibold'>{label}</div>
      <ScrollArea className='h-36'>
        <div className='grid grid-cols-2 gap-x-4 gap-y-2.5 pr-4'>
          {options.map((opt) => (
            <div key={opt.value} className='flex items-center gap-2'>
              <Checkbox
                id={`${label}-${opt.value}`}
                checked={value.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              <Label htmlFor={`${label}-${opt.value}`} className='cursor-pointer text-sm font-normal'>
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TutorFilters() {
  const [search, setSearch] = useQueryState('search', tutorSearchParams.search.withOptions({ shallow: false }));
  const [subjects, setSubjects] = useQueryState('subjects', tutorSearchParams.subjects.withOptions({ shallow: false }));
  const [province, setProvince] = useQueryState('province', tutorSearchParams.province.withOptions({ shallow: false }));
  const [gender, setGender] = useQueryState('gender', tutorSearchParams.gender.withOptions({ shallow: false }));
  const [teachingMethod, setTeachingMethod] = useQueryState('teaching_method', tutorSearchParams.teaching_method.withOptions({ shallow: false }));
  const [sort, setSort] = useQueryState('sort', tutorSearchParams.sort.withOptions({ shallow: false }));
  const [, setPage] = useQueryState('page', tutorSearchParams.page.withOptions({ shallow: false }));

  const [filterOpen, setFilterOpen] = useState(false);

  // Search local state & debounce
  const [localSearch, setLocalSearch] = useState(search ?? '');

  useEffect(() => {
    setLocalSearch(search ?? '');
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (search ?? '')) {
        setSearch(localSearch || null);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, search, setSearch, setPage]);

  // Local filter states for advanced filter popover
  const [localSubjects, setLocalSubjects] = useState<string[]>([]);
  const [localProvinces, setLocalProvinces] = useState<string[]>([]);
  const [localGenders, setLocalGenders] = useState<string[]>([]);
  const [localMethods, setLocalMethods] = useState<string[]>([]);

  // Open handler to sync local states from URL query params
  const handlePopoverOpenChange = (open: boolean) => {
    setFilterOpen(open);
    if (open) {
      setLocalSubjects(subjects ? subjects.split(',').filter(Boolean) : []);
      setLocalProvinces(province ? province.split(',').filter(Boolean) : []);
      setLocalGenders(gender ? gender.split(',').filter(Boolean) : []);
      setLocalMethods(teachingMethod ? teachingMethod.split(',').filter(Boolean) : []);
    }
  };

  const handleApplyFilters = () => {
    setSubjects(localSubjects.length ? localSubjects.join(',') : null);
    setProvince(localProvinces.length ? localProvinces.join(',') : null);
    setGender(localGenders.length ? localGenders.join(',') : null);
    setTeachingMethod(localMethods.length ? localMethods.join(',') : null);
    setPage(1);
    setFilterOpen(false);
  };

  const handleClearLocalFilters = () => {
    setLocalSubjects([]);
    setLocalProvinces([]);
    setLocalGenders([]);
    setLocalMethods([]);
  };

  const { data: filterOptions } = useQuery(tutorFilterOptionsQuery());

  const subjectsOptions = useMemo(() => {
    if (filterOptions?.subjects) {
      return filterOptions.subjects.map((s) => ({ value: String(s.id), label: s.name }));
    }
    return [
      { value: '1', label: 'Toán' },
      { value: '2', label: 'Vật Lý' },
      { value: '3', label: 'Hóa Học' },
      { value: '4', label: 'Sinh Học' },
      { value: '5', label: 'Ngữ Văn' },
      { value: '6', label: 'Tiếng Anh' },
      { value: '7', label: 'Lịch Sử' },
      { value: '8', label: 'Địa Lý' },
      { value: '9', label: 'Tin Học' },
      { value: '10', label: 'GDCD' }
    ];
  }, [filterOptions]);

  const provinceOptions = useMemo(() => {
    if (filterOptions?.provinces) {
      return filterOptions.provinces.map((p) => ({ value: p, label: p }));
    }
    const provincesList = [
      'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
      'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
      'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông'
    ];
    return provincesList.map((p) => ({ value: p, label: p }));
  }, [filterOptions]);

  const genderOptions = useMemo(() => {
    if (filterOptions?.genders) {
      return filterOptions.genders.map((g) => ({ value: g.value, label: g.label }));
    }
    return [
      { value: 'MALE', label: 'Nam' },
      { value: 'FEMALE', label: 'Nữ' },
      { value: 'OTHER', label: 'Khác' }
    ];
  }, [filterOptions]);

  const methodOptions = useMemo(() => {
    if (filterOptions?.teachingModes) {
      return filterOptions.teachingModes.map((m) => ({ value: m.value, label: m.label }));
    }
    return [
      { value: 'ONLINE', label: 'Online' },
      { value: 'OFFLINE', label: 'Tại nhà / Trung tâm' },
      { value: 'HYBRID', label: 'Linh hoạt' }
    ];
  }, [filterOptions]);

  const selectedSubjects = subjects ? subjects.split(',').filter(Boolean) : [];
  const selectedProvinces = province ? province.split(',').filter(Boolean) : [];
  const selectedGenders = gender ? gender.split(',').filter(Boolean) : [];
  const selectedMethods = teachingMethod ? teachingMethod.split(',').filter(Boolean) : [];

  const totalActiveFilters =
    selectedSubjects.length +
    selectedProvinces.length +
    selectedGenders.length +
    selectedMethods.length;

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearch(val || null);
      setPage(1);
    },
    [setSearch, setPage]
  );

  const handleSubjectsChange = useCallback(
    (val: string[]) => {
      setSubjects(val.length ? val.join(',') : null);
      setPage(1);
    },
    [setSubjects, setPage]
  );

  const handleProvincesChange = useCallback(
    (val: string[]) => {
      setProvince(val.length ? val.join(',') : null);
      setPage(1);
    },
    [setProvince, setPage]
  );

  const handleGendersChange = useCallback(
    (val: string[]) => {
      setGender(val.length ? val.join(',') : null);
      setPage(1);
    },
    [setGender, setPage]
  );

  const handleMethodsChange = useCallback(
    (val: string[]) => {
      setTeachingMethod(val.length ? val.join(',') : null);
      setPage(1);
    },
    [setTeachingMethod, setPage]
  );

  const clearAllFilters = () => {
    setSearch(null);
    setLocalSearch('');
    setSubjects(null);
    setProvince(null);
    setGender(null);
    setTeachingMethod(null);
    setPage(1);
    handleClearLocalFilters();
  };

  return (
    <div className='flex flex-col gap-3'>
      {/* Search bar + Sort + Filter button */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        {/* Search */}
        <div className='relative flex-1'>
          <IconSearch
            size={16}
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'
          />
          <Input
            id='tutor-search'
            placeholder='Tìm gia sư theo tên, trường, mô tả...'
            className='pl-9 pr-8'
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
              onClick={() => {
                setLocalSearch('');
                setSearch(null);
                setPage(1);
              }}
            >
              <IconX size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select value={sort ?? 'experience_years:desc'} onValueChange={(val) => setSort(val)}>
          <SelectTrigger id='tutor-sort' className='w-full sm:w-52'>
            <SelectValue placeholder='Sắp xếp' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='experience_years:desc'>Nhiều kinh nghiệm nhất</SelectItem>
            <SelectItem value='price_per_session:asc'>Giá thấp nhất</SelectItem>
            <SelectItem value='price_per_session:desc'>Giá cao nhất</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter button */}
        <Popover open={filterOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='relative gap-2 sm:w-auto' id='filter-button'>
              <IconAdjustmentsHorizontal size={16} />
              Bộ lọc
              {totalActiveFilters > 0 && (
                <span className='bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold'>
                  {totalActiveFilters}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[95vw] sm:w-[500px] p-5' align='end' side='bottom'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-foreground font-semibold'>Bộ lọc nâng cao</h3>
              {(localSubjects.length > 0 ||
                localProvinces.length > 0 ||
                localGenders.length > 0 ||
                localMethods.length > 0) && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-muted-foreground h-6 px-2 text-xs'
                  onClick={handleClearLocalFilters}
                >
                  <IconX size={12} className='mr-1' />
                  Xóa tất cả
                </Button>
              )}
            </div>

            <div className='space-y-4'>
              <MultiSelectFilter
                label='Môn học'
                options={subjectsOptions}
                value={localSubjects}
                onChange={setLocalSubjects}
              />
              <Separator />
              <MultiSelectFilter
                label='Tỉnh / Thành phố'
                options={provinceOptions.slice(0, 20)}
                value={localProvinces}
                onChange={setLocalProvinces}
              />
              <Separator />
              <MultiSelectFilter
                label='Giới tính gia sư'
                options={genderOptions}
                value={localGenders}
                onChange={setLocalGenders}
              />
              <Separator />
              <MultiSelectFilter
                label='Hình thức dạy'
                options={methodOptions}
                value={localMethods}
                onChange={setLocalMethods}
              />
            </div>

            <div className='mt-4'>
              <Button
                className='w-full'
                size='sm'
                onClick={handleApplyFilters}
              >
                <IconFilter size={14} className='mr-2' />
                Áp dụng bộ lọc
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filter chips */}
      {totalActiveFilters > 0 && (
        <div className='flex flex-wrap gap-2'>
          {selectedSubjects.map((s) => (
            <Badge
              key={`sub-${s}`}
              variant='secondary'
              className='cursor-pointer gap-1 pr-1'
              onClick={() => handleSubjectsChange(selectedSubjects.filter((x) => x !== s))}
            >
              {subjectsOptions.find(o => o.value === s)?.label || s}
              <IconX size={10} />
            </Badge>
          ))}
          {selectedProvinces.map((p) => (
            <Badge
              key={`prov-${p}`}
              variant='secondary'
              className='cursor-pointer gap-1 pr-1'
              onClick={() => handleProvincesChange(selectedProvinces.filter((x) => x !== p))}
            >
              {p}
              <IconX size={10} />
            </Badge>
          ))}
          {selectedGenders.map((g) => (
            <Badge
              key={`gen-${g}`}
              variant='secondary'
              className='cursor-pointer gap-1 pr-1'
              onClick={() => handleGendersChange(selectedGenders.filter((x) => x !== g))}
            >
              {genderOptions.find(o => o.value === g)?.label || g}
              <IconX size={10} />
            </Badge>
          ))}
          {selectedMethods.map((m) => (
            <Badge
              key={`mtd-${m}`}
              variant='secondary'
              className='cursor-pointer gap-1 pr-1'
              onClick={() => handleMethodsChange(selectedMethods.filter((x) => x !== m))}
            >
              {methodOptions.find(o => o.value === m)?.label || m}
              <IconX size={10} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
