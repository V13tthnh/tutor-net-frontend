import { queryOptions } from '@tanstack/react-query';
import {
  getSessions,
  getTutorReviews,
  getPublicTutorReviews,
  getAllReviews
} from './service';
import type { SessionsFilters } from './types';

export const reviewKeys = {
  all: ['reviews'] as const,
  tutorList: (tutorId: number) => [...reviewKeys.all, 'tutor', tutorId] as const,
  publicTutorList: (tutorId: number) => [...reviewKeys.all, 'tutor', tutorId, 'public'] as const,
  adminList: () => [...reviewKeys.all, 'admin'] as const
};

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (filters: SessionsFilters) => [...sessionKeys.all, 'list', filters] as const
};

export const sessionsQueryOptions = (filters: SessionsFilters) =>
  queryOptions({
    queryKey: sessionKeys.list(filters),
    queryFn: () => getSessions(filters)
  });

export const tutorReviewsQueryOptions = (tutorId: number) =>
  queryOptions({
    queryKey: reviewKeys.tutorList(tutorId),
    queryFn: () => getTutorReviews(tutorId)
  });

export const publicTutorReviewsQueryOptions = (tutorId: number) =>
  queryOptions({
    queryKey: reviewKeys.publicTutorList(tutorId),
    queryFn: () => getPublicTutorReviews(tutorId)
  });

export const adminReviewsQueryOptions = () =>
  queryOptions({
    queryKey: reviewKeys.adminList(),
    queryFn: () => getAllReviews()
  });
export type { Review, Session } from './types';
export { getTutorReviews, getPublicTutorReviews, getSessions, getAllReviews };
export { reviewKeys as reviewQueryKeys, sessionKeys as sessionQueryKeys };
