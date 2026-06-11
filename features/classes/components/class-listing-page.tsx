import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { classSearchParamsCache } from '@/features/classes/lib/search-params';
import { classRequestsQueryOptions } from '@/features/classes/api/queries';
import { ClassListingClient } from '@/features/classes/components/class-listing-client';

interface ClassListingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ClassListingPage({ searchParams }: ClassListingPageProps) {
  const params = await searchParams;
  classSearchParamsCache.parse(params);

  const page = classSearchParamsCache.get('page');
  const limit = classSearchParamsCache.get('limit');
  const subjectId = classSearchParamsCache.get('subjectId');
  const teachingMode = classSearchParamsCache.get('teachingMode');
  const sort = classSearchParamsCache.get('sort');

  const [sortBy, sortDir] = sort ? sort.split(':') : ['createdAt', 'desc'];

  const filters = {
    page,
    limit,
    ...(subjectId && { subjectId }),
    ...(teachingMode && { teachingMode }),
    sortBy,
    sortDir
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(classRequestsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClassListingClient filters={filters} />
    </HydrationBoundary>
  );
}
