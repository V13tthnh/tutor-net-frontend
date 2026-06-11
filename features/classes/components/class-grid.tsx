'use client';

import { useQuery } from '@tanstack/react-query';
import { classRequestsQueryOptions } from '../api/queries';
import { ClassCard } from './class-card';
import { ClassPagination } from './class-pagination';
import type { ClassFilters, ClassRequest } from '../api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { IconSchool, IconMoodSad } from '@tabler/icons-react';

function ClassCardSkeleton() {
  return (
    <div className='border rounded-xl p-5 space-y-4 bg-card'>
      {/* Header */}
      <div className='space-y-2'>
        <div className='flex gap-2'>
          <Skeleton className='h-5 w-14' />
          <Skeleton className='h-5 w-20' />
        </div>
        <Skeleton className='h-5 w-48' />
      </div>

      {/* Price Box */}
      <div className='bg-muted/50 rounded-xl p-3.5 border space-y-1.5'>
        <Skeleton className='h-3.5 w-24' />
        <Skeleton className='h-6 w-36' />
      </div>

      {/* Details Grid */}
      <div className='grid grid-cols-2 gap-3 pb-3 border-b'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-4 w-40 col-span-2' />
      </div>

      {/* Notes */}
      <div className='space-y-2'>
        <Skeleton className='h-3.5 w-24' />
        <Skeleton className='h-12 w-full rounded-lg' />
      </div>

      {/* Mode and Meta */}
      <div className='flex justify-between pt-2 border-t'>
        <Skeleton className='h-5 w-32 rounded-full' />
        <Skeleton className='h-3.5 w-16' />
      </div>

      {/* Action buttons */}
      <div className='flex gap-3 pt-2'>
        <Skeleton className='h-9 flex-1 rounded-md' />
        <Skeleton className='h-9 flex-1 rounded-md' />
      </div>
    </div>
  );
}

interface ClassGridProps {
  filters: ClassFilters;
  onApplyClick?: (classRequest: ClassRequest) => void;
  onDetailClick?: (classRequest: ClassRequest) => void;
}

export function ClassGrid({ filters, onApplyClick, onDetailClick }: ClassGridProps) {
  const { data, isLoading, isError } = useQuery(classRequestsQueryOptions(filters));

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-32' />
        </div>
        
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card'>
        <IconMoodSad size={48} className='text-destructive mb-4 animate-bounce' />
        <p className='text-foreground text-lg font-bold'>Đã xảy ra lỗi khi tải dữ liệu</p>
        <p className='text-muted-foreground mt-1 text-sm'>Vui lòng thử lại sau.</p>
      </div>
    );
  }

  const list = data?.data?.content || [];
  const totalElements = data?.data?.totalElements || 0;

  if (list.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-card'>
        <IconSchool size={48} className='text-muted-foreground mb-4 opacity-70' />
        <p className='text-foreground text-lg font-bold'>Không tìm thấy lớp học nào</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          Thử thay đổi bộ lọc hoặc môn học tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm font-medium'>
          Tìm thấy <span className='text-foreground font-bold'>{totalElements}</span> lớp học phù hợp
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {list.map((item) => (
          <ClassCard
            key={item.id}
            classRequest={item}
            onApplyClick={onApplyClick}
            onDetailClick={onDetailClick}
          />
        ))}
      </div>

      {/* Pagination */}
      <ClassPagination
        totalElements={totalElements}
        limit={data?.data?.size || 12}
      />
    </div>
  );
}
