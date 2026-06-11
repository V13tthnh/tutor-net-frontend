import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { subjectsQueryOptions, subjectStatsQueryOptions } from '../api/queries';
import { SubjectsTable, SubjectsTableSkeleton } from './subjects-table';
import { SubjectStatistics, SubjectStatisticsSkeleton } from './subject-stats';
import { Suspense } from 'react';

export default function SubjectListingPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Đọc query params từ URL: ?keyword=...&isActive=...
  const keyword = typeof searchParams?.keyword === 'string' ? searchParams.keyword : undefined;
  const isActiveRaw = typeof searchParams?.isActive === 'string' ? searchParams.isActive : undefined;
  const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;

  const filters = {
    ...(keyword && { keyword }),
    ...(isActive !== undefined && { isActive })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(subjectsQueryOptions(filters));
  void queryClient.prefetchQuery(subjectStatsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-4'>
        <Suspense fallback={<SubjectStatisticsSkeleton />}>
          <SubjectStatistics />
        </Suspense>
        <Suspense fallback={<SubjectsTableSkeleton />}>
          <SubjectsTable />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
