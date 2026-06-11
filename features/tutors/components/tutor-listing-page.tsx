import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { tutorSearchParamsCache } from '@/features/tutors/lib/search-params';
import { tutorsQueryOptions } from '@/features/tutors/api/queries';
import { TutorListingClient } from '@/features/tutors/components/tutor-listing-client';

interface TutorsListingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TutorsListingPage({ searchParams }: TutorsListingPageProps) {
  const params = await searchParams;
  tutorSearchParamsCache.parse(params);

  const page = tutorSearchParamsCache.get('page');
  const limit = tutorSearchParamsCache.get('limit');
  const search = tutorSearchParamsCache.get('search');
  const subjects = tutorSearchParamsCache.get('subjects');
  const levels = tutorSearchParamsCache.get('levels');
  const province = tutorSearchParamsCache.get('province');
  const gender = tutorSearchParamsCache.get('gender');
  const teachingMethod = tutorSearchParamsCache.get('teaching_method');
  const sort = tutorSearchParamsCache.get('sort');

  const filters = {
    page,
    limit,
    ...(search && { search }),
    ...(subjects && { subjects }),
    ...(levels && { levels }),
    ...(province && { province }),
    ...(gender && { gender }),
    ...(teachingMethod && { teaching_method: teachingMethod }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(tutorsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TutorListingClient filters={filters} />
    </HydrationBoundary>
  );
}
