import { apiClient } from '@/lib/api-client';
import type { PageResponse } from '@/features/classes/api/types';
import { fakeSessions } from '@/constants/mock-api-sessions';
import { fakeReviews } from '@/constants/mock-api-reviews';
import type {
  Session,
  Review,
  CreateReviewPayload,
  ReplyReviewPayload,
  TogglePublicPayload,
  SessionsFilters,
  AdminReviewResponse,
  AdminReviewFilters,
} from './types';

// ─── Legacy mock-based functions (still used by session-listing / tutor-reviews-tab) ───
export async function getSessions(filters: SessionsFilters): Promise<Session[]> {
  return fakeSessions.getSessions(filters);
}

export async function getTutorReviews(tutorId: number): Promise<Review[]> {
  return fakeReviews.getTutorReviews(tutorId);
}

export async function getPublicTutorReviews(tutorId: number): Promise<Review[]> {
  return fakeReviews.getPublicReviewsForTutor(tutorId);
}

export async function getAllReviews(): Promise<Review[]> {
  return fakeReviews.getAllReviews();
}

export async function createReview(payload: CreateReviewPayload) {
  return fakeReviews.createReview(payload);
}

export async function replyToReview(payload: ReplyReviewPayload) {
  return fakeReviews.replyToReview(payload.id, payload.reply);
}

export async function toggleReviewPublic(payload: TogglePublicPayload) {
  return fakeReviews.toggleReviewPublic(payload.id, payload.is_public);
}

export async function completeSession(id: number): Promise<boolean> {
  return fakeSessions.completeSession(id);
}

// ─── Real backend API calls ──────────────────────────────────────────────────

/**
 * GET /api/v1/admin/reviews
 * Lấy danh sách đánh giá phân trang kèm bộ lọc cho Admin
 * Backend paging is 0-indexed; we convert from 1-indexed UI page here.
 */
export async function getAdminReviews(
  filters: AdminReviewFilters
): Promise<{ success: boolean; data: PageResponse<AdminReviewResponse> }> {
  const params = new URLSearchParams();

  // Backend page is 0-indexed
  const backendPage = filters.page != null ? filters.page - 1 : 0;
  params.append('page', String(backendPage < 0 ? 0 : backendPage));
  params.append('size', String(filters.size ?? 10));

  if (filters.rating != null) params.append('rating', String(filters.rating));
  if (filters.isPublic != null) params.append('isPublic', String(filters.isPublic));
  if (filters.search?.trim()) params.append('search', filters.search.trim());

  return apiClient<{ success: boolean; data: PageResponse<AdminReviewResponse> }>(
    `/admin/reviews?${params.toString()}`
  );
}

/**
 * PATCH /api/v1/admin/reviews/{id}/toggle-visibility
 * Bật/Tắt trạng thái công khai của một đánh giá
 */
export async function toggleAdminReviewVisibility(id: number): Promise<void> {
  return apiClient<void>(`/admin/reviews/${id}/toggle-visibility`, {
    method: 'PATCH',
  });
}
