import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { tutorByIdOptions } from '../api/queries';
import { TutorDetailClient } from './tutor-detail-client';

interface TutorDetailPageProps {
  id: number;
}

export default async function TutorDetailPage({ id }: TutorDetailPageProps) {
  const queryClient = getQueryClient();

  // Prefetch the tutor data
  void queryClient.prefetchQuery(tutorByIdOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TutorDetailClient id={id} />
    </HydrationBoundary>
  );
}
