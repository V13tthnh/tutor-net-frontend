'use client';

import { useQueryState } from 'nuqs';
import { classSearchParams } from '../lib/search-params';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Subject } from '@/features/subjects/api/types';
import { IconX, IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useMemo } from 'react';

const fetchSubjectsTree = async () => {
  const res = await apiClient<{ data: Subject[] }>('/subjects/tree');
  return res.data || [];
};

export function ClassFilters() {
  const [subjectId, setSubjectId] = useQueryState('subjectId', classSearchParams.subjectId.withOptions({ shallow: false }));
  const [teachingMode, setTeachingMode] = useQueryState('teachingMode', classSearchParams.teachingMode.withOptions({ shallow: false }));
  const [sort, setSort] = useQueryState('sort', classSearchParams.sort.withOptions({ shallow: false }));
  const [, setPage] = useQueryState('page', classSearchParams.page.withOptions({ shallow: false }));

  // Query to fetch subjects tree
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-tree'],
    queryFn: fetchSubjectsTree
  });

  const flattenedSubjects = useMemo(() => {
    if (!subjectsData) return [];
    const list: { id: number; name: string; isChild: boolean }[] = [];
    subjectsData.forEach((parent) => {
      list.push({ id: parent.id, name: parent.name, isChild: false });
      parent.children?.forEach((child) => {
        list.push({ id: child.id, name: `↳ ${child.name}`, isChild: true });
      });
    });
    return list;
  }, [subjectsData]);

  const handleSubjectChange = (val: string) => {
    setSubjectId(val === 'all' ? null : Number(val));
    setPage(1);
  };

  const handleModeChange = (val: string) => {
    setTeachingMode(val === 'all' ? null : val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSubjectId(null);
    setTeachingMode(null);
    setSort('createdAt:desc');
    setPage(1);
  };

  const hasActiveFilters = subjectId !== null || teachingMode !== null || sort !== 'createdAt:desc';

  return (
    <div className='bg-card border rounded-xl p-4 shadow-sm space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 rounded-lg bg-primary/10 text-primary'>
            <IconAdjustmentsHorizontal size={18} />
          </div>
          <span className='font-bold text-sm text-foreground uppercase tracking-wider'>
            Bộ lọc tìm kiếm
          </span>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClearFilters}
            className='h-8 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5'
          >
            <IconX size={14} className='mr-1.5' />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {/* Subject Filter */}
        <div className='space-y-1.5'>
          <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>Môn học</label>
          <Select value={subjectId ? String(subjectId) : 'all'} onValueChange={handleSubjectChange}>
            <SelectTrigger className='w-full bg-background/50 hover:bg-background/80 transition-colors border-border/80'>
              <SelectValue placeholder='Chọn môn học' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='font-medium'>Tất cả môn học</SelectItem>
              {flattenedSubjects.map((sub) => (
                <SelectItem
                  key={sub.id}
                  value={String(sub.id)}
                  className={sub.isChild ? 'pl-6 text-muted-foreground text-sm' : 'font-semibold'}
                >
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Teaching Mode Filter */}
        <div className='space-y-1.5'>
          <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>Hình thức học</label>
          <Select value={teachingMode ?? 'all'} onValueChange={handleModeChange}>
            <SelectTrigger className='w-full bg-background/50 hover:bg-background/80 transition-colors border-border/80'>
              <SelectValue placeholder='Chọn hình thức học' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='font-medium'>Tất cả hình thức</SelectItem>
              <SelectItem value='ONLINE'>Online (Trực tuyến)</SelectItem>
              <SelectItem value='OFFLINE'>Offline (Tại nhà)</SelectItem>
              <SelectItem value='HYBRID'>Onlive + Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sorting */}
        <div className='space-y-1.5'>
          <label className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>Sắp xếp theo</label>
          <Select value={sort ?? 'createdAt:desc'} onValueChange={handleSortChange}>
            <SelectTrigger className='w-full bg-background/50 hover:bg-background/80 transition-colors border-border/80'>
              <SelectValue placeholder='Chọn thứ tự' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='createdAt:desc'>Mới nhất</SelectItem>
              <SelectItem value='createdAt:asc'>Cũ nhất</SelectItem>
              <SelectItem value='proposedPrice:desc'>Học phí: Cao đến thấp</SelectItem>
              <SelectItem value='proposedPrice:asc'>Học phí: Thấp đến cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
