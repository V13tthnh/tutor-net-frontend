import { queryOptions } from '@tanstack/react-query';
import { getTutors, getFeaturedTutors, getTutorById, getTutorFilterOptions } from './service';
import type { TutorFilters } from './types';

export type { Tutor } from '@/constants/mock-api-tutors';

export const tutorKeys = {
  all: ['tutors'] as const,
  list: (filters: TutorFilters) => [...tutorKeys.all, 'list', filters] as const,
  featured: () => [...tutorKeys.all, 'featured'] as const,
  detail: (id: number) => [...tutorKeys.all, 'detail', id] as const,
  filterOptions: () => [...tutorKeys.all, 'filter-options'] as const
};

export const tutorsQueryOptions = (filters: TutorFilters) =>
  queryOptions({
    queryKey: tutorKeys.list(filters),
    queryFn: () => getTutors(filters)
  });

export const featuredTutorsQueryOptions = queryOptions({
  queryKey: tutorKeys.featured(),
  queryFn: () => getFeaturedTutors(6)
});

export const tutorByIdOptions = (id: number) =>
  queryOptions({
    queryKey: tutorKeys.detail(id),
    queryFn: () => getTutorById(id)
  });

export const tutorFilterOptionsQuery = () =>
  queryOptions({
    queryKey: tutorKeys.filterOptions(),
    queryFn: () => getTutorFilterOptions()
  });


