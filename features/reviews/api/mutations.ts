import { createReview, replyToReview, toggleReviewPublic, completeSession } from './service';

export const createReviewMutation = {
  mutationFn: createReview
};

export const replyToReviewMutation = {
  mutationFn: replyToReview
};

export const toggleReviewPublicMutation = {
  mutationFn: toggleReviewPublic
};

export const completeSessionMutation = {
  mutationFn: completeSession
};
