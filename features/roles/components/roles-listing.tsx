import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { rolesQueryOptions } from '../api/queries';
import { RolesTable, RolesTableSkeleton } from './roles-table';
import { Suspense } from 'react';

export default function RolesListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('keyword');
  const pageLimit = searchParamsCache.get('limit');
  const sortBy = searchParamsCache.get('sortBy');
  const sortDir = searchParamsCache.get('sortDir');

  const sortingState = sortBy
    ? [{ id: sortBy, desc: sortDir === 'desc' }]
    : [];

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search: search as string }),
    ...(sortingState.length > 0 && { sort: JSON.stringify(sortingState) })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(rolesQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<RolesTableSkeleton />}>
        <RolesTable />
      </Suspense>
    </HydrationBoundary>
  );
}
