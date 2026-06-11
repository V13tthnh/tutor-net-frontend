import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions, userStatsQueryOptions, userFilterOptionsQueryOptions } from '../api/queries';
import { UsersTable, UsersTableSkeleton } from './users-table';
import { UserStatistics, UserStatisticsSkeleton } from './user-stats';
import { Suspense } from 'react';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('keyword');
  const pageLimit = searchParamsCache.get('limit');
  const roles = searchParamsCache.get('roles') || ['admin', 'super_admin'];
  const status = searchParamsCache.get('status');
  const sortBy = searchParamsCache.get('sortBy');
  const sortDir = searchParamsCache.get('sortDir');

  const sortingState = sortBy
    ? [{ id: sortBy, desc: sortDir === 'desc' }]
    : [];

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    roles,
    ...(status && { status }),
    ...(sortingState.length > 0 && { sort: JSON.stringify(sortingState) })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(usersQueryOptions(filters));
  void queryClient.prefetchQuery(userStatsQueryOptions());
  void queryClient.prefetchQuery(userFilterOptionsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='space-y-4'>
        <Suspense fallback={<UserStatisticsSkeleton />}>
          <UserStatistics />
        </Suspense>
        <Suspense fallback={<UsersTableSkeleton />}>
          <UsersTable />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

