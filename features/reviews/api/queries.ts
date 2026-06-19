import { queryOptions } from '@tanstack/react-query';
import {
  getSessions,
  getTutorReviews,
  getPublicTutorReviews,
  getAllReviews,
  getAdminReviews,
} from './service';
import type { SessionsFilters, AdminReviewFilters } from './types';

// ─── Query key factories ──────────────────────────────────────────────────────
export const reviewKeys = {
  all: ['reviews'] as const,
  tutorList: (tutorId: number) => [...reviewKeys.all, 'tutor', tutorId] as const,
  publicTutorList: (tutorId: number) =>
    [...reviewKeys.all, 'tutor', tutorId, 'public'] as const,
  adminList: (filters: AdminReviewFilters = {}) =>
    [...reviewKeys.all, 'admin', filters] as const,
};

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (filters: SessionsFilters) => [...sessionKeys.all, 'list', filters] as const,
};

// ─── Legacy query options (kept for existing components) ─────────────────────
export const sessionsQueryOptions = (filters: SessionsFilters) =>
  queryOptions({
    queryKey: sessionKeys.list(filters),
    queryFn: () => getSessions(filters),
  });

export const tutorReviewsQueryOptions = (tutorId: number) =>
  queryOptions({
    queryKey: reviewKeys.tutorList(tutorId),
    queryFn: () => getTutorReviews(tutorId),
  });

export const publicTutorReviewsQueryOptions = (tutorId: number) =>
  queryOptions({
    queryKey: reviewKeys.publicTutorList(tutorId),
    queryFn: () => getPublicTutorReviews(tutorId),
  });

/** @deprecated Dùng adminReviewsQueryOptions thay thế */
export const adminReviewsQueryOptions = () =>
  queryOptions({
    queryKey: reviewKeys.adminList(),
    queryFn: () => getAllReviews(),
  });

// ─── Real backend query options (server-side pagination + filters) ────────────
export const adminReviewsPaginatedQueryOptions = (filters: AdminReviewFilters = {}) =>
  queryOptions({
    queryKey: reviewKeys.adminList(filters),
    queryFn: () => getAdminReviews(filters),
    placeholderData: (prev) => prev,
  });

// ─── Re-exports for backward compat ──────────────────────────────────────────
export type { Review, Session } from './types';
export { getTutorReviews, getPublicTutorReviews, getSessions, getAllReviews };
export { reviewKeys as reviewQueryKeys, sessionKeys as sessionQueryKeys };
