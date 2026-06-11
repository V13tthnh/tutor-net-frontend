import { fakeSessions } from '@/constants/mock-api-sessions';
import { fakeReviews } from '@/constants/mock-api-reviews';
import type {
  Session,
  Review,
  CreateReviewPayload,
  ReplyReviewPayload,
  TogglePublicPayload,
  SessionsFilters
} from './types';

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
