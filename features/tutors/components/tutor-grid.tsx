import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tutorsQueryOptions } from '../api/queries';
import { TutorCard } from './tutor-card';
import { TutorPagination } from './tutor-pagination';
import type { TutorFilters } from '../api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { IconUsersGroup, IconMoodSad, IconLayoutGrid, IconList } from '@tabler/icons-react';
import type { Tutor } from '@/constants/mock-api-tutors';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { getClientSecurityFlags } from '@/features/security-sandbox/components/interceptor';

function TutorCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  const isList = layout === 'list';
  return (
    <div className={cn('border-border flex rounded-xl border p-5', isList ? 'flex-col sm:flex-row' : 'flex-col')}>
      <div className={cn('flex gap-4', isList && 'sm:w-64 shrink-0')}>
        <Skeleton className={cn('rounded-full', isList ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-16 w-16')} />
        <div className='flex-1 space-y-2 mt-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-3 w-20' />
        </div>
      </div>
      <div className='flex-1 mt-3 sm:mt-0 px-0 sm:px-6 space-y-3'>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='mt-2 h-8 w-full' />
        <div className='mt-3 flex gap-1'>
          <Skeleton className='h-5 w-14 rounded-full' />
          <Skeleton className='h-5 w-14 rounded-full' />
        </div>
      </div>
      <div className={cn(
        isList
          ? 'sm:w-64 sm:border-l p-5 justify-center gap-4 flex flex-col items-center mt-3 sm:mt-0'
          : 'mt-auto flex items-center justify-between pt-3'
      )}>
        <Skeleton className='h-8 w-24' />
        <Skeleton className='h-8 w-24' />
      </div>
    </div>
  );
}

interface TutorGridProps {
  filters: TutorFilters;
  onContactClick?: (tutor: Tutor) => void;
  onInviteClick?: (tutor: Tutor) => void;
}

export function TutorGrid({ filters, onContactClick, onInviteClick }: TutorGridProps) {
  const { data, isLoading, isError } = useQuery(tutorsQueryOptions(filters));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // SQLi interception state
  const [sqliData, setSqliData] = useState<any[] | null>(null);
  const [sqliError, setSqliError] = useState<string>('');

  // Use useEffect instead of directly in render to prevent hydration mismatch
  const [flags, setFlags] = useState<string[]>([]);

  useEffect(() => {
    setFlags(getClientSecurityFlags());
  }, []);

  const searchVal = filters.search || '';

  useEffect(() => {
    const currentFlags = getClientSecurityFlags();
    if (currentFlags.includes('union_sqli') && (/'\s*union\s+select/i.test(searchVal) || /or\s+1\s*=\s*1/i.test(searchVal) || /drop\s+table/i.test(searchVal))) {
      fetch(`/api/demo/sqli/vulnerable?name=${encodeURIComponent(searchVal)}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.data) {
            setSqliData(resData.data);
          } else if (resData.error) {
            setSqliError(resData.error);
          }
        })
        .catch(err => setSqliError(err.message));
    } else {
      setSqliData(null);
      setSqliError('');
    }
  }, [searchVal]);

  if (sqliData || sqliError) {
    return (
      <div className="space-y-4 w-full">

        {sqliError ? (
          <div className="text-red-500 font-mono text-sm bg-red-500/10 p-4 rounded border border-red-500/20">
            {sqliError}
          </div>
        ) : (
          <div className="flex flex-col gap-2 font-mono text-sm">
            {sqliData?.map((row, idx) => (
              <div key={idx} className="bg-muted/50 p-3 border border-border rounded hover:bg-muted transition-colors text-foreground">
                {Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ')}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }



  if (isLoading) {
    return (
      <div className='space-y-6'>
        {/* Toggle skeleton / static area */}
        <div className='flex items-center justify-between'>
          <Skeleton className="h-4 w-32" />
          <div className='flex items-center gap-1 bg-muted p-1 rounded-lg'>
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>

        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-5'
        )}>
          {Array.from({ length: 12 }).map((_, i) => (
            <TutorCardSkeleton key={i} layout={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <IconMoodSad size={48} className='text-muted-foreground mb-4' />
        <p className='text-foreground text-lg font-semibold'>Đã xảy ra lỗi</p>
        <p className='text-muted-foreground mt-1 text-sm'>Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!data || data.tutors.length === 0) {
    const isHtmlInjectionActive = flags.includes('html_injection');
    const searchValForHtml = filters.search;

    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <IconUsersGroup size={48} className='text-muted-foreground mb-4' />
        <p className='text-foreground text-lg font-semibold'>
          Không tìm thấy gia sư {searchValForHtml ? (
            isHtmlInjectionActive ? (
              <span dangerouslySetInnerHTML={{ __html: searchValForHtml }} />
            ) : (
              <span>"{searchValForHtml}"</span>
            )
          ) : ''}
        </p>
        <p className='text-muted-foreground mt-1 text-sm'>
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Result count & View Toggle */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-muted-foreground text-sm'>
          Tìm thấy{' '}
          <span className='text-foreground font-semibold'>{data.total_tutors}</span> gia sư
        </p>

        <div className='flex items-center gap-1 bg-muted/50 p-1 rounded-lg border'>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size='icon'
            className={cn('h-8 w-8 rounded-md', viewMode === 'grid' && 'bg-background shadow-sm')}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <IconLayoutGrid size={18} className={viewMode === 'grid' ? 'text-foreground' : 'text-muted-foreground'} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size='icon'
            className={cn('h-8 w-8 rounded-md', viewMode === 'list' && 'bg-background shadow-sm')}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <IconList size={18} className={viewMode === 'list' ? 'text-foreground' : 'text-muted-foreground'} />
          </Button>
        </div>
      </div>

      {/* Grid / List */}
      <div className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'flex flex-col gap-5'
      )}>
        {data.tutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            layout={viewMode}
            onContactClick={onContactClick}
            onInviteClick={onInviteClick}
          />
        ))}
      </div>

      {/* Pagination */}
      <TutorPagination totalTutors={data.total_tutors} limit={data.limit} />
    </div>
  );
}
