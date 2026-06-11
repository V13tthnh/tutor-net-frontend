// //////////////////////////////////////////////////////////////////////////////
// Mock API Reviews Database
// //////////////////////////////////////////////////////////////////////////////

import { fakeTutors } from './mock-api-tutors';
import { fakeSessions } from './mock-api-sessions';

export interface Review {
  id: number;
  session_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewee_id: number; // Tutor ID
  rating: number; // 1-5
  comment: string;
  is_public: boolean;
  reply?: string;
  replied_at?: string;
  is_reported?: boolean;
  private_feedback?: string;
  created_at: string;
  updated_at: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    session_id: 2,
    reviewer_id: 1001,
    reviewer_name: 'Nguyễn Minh',
    reviewer_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Minh',
    reviewee_id: 2,
    rating: 5,
    comment: 'Cô giảng bài rất dễ hiểu, bé nhà tôi tiến bộ nhiều. Phương pháp dạy rất trực quan.',
    is_public: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    id: 2,
    session_id: 5,
    reviewer_id: 1002,
    reviewer_name: 'Trần Thảo Vy',
    reviewer_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vy',
    reviewee_id: 1,
    rating: 4,
    comment: 'Thầy dạy nhiệt tình, đi học rất đúng giờ. Bé thích học với thầy.',
    is_public: true,
    reply: 'Cảm ơn chị Vy đã tin tưởng. Tôi sẽ cố gắng đồng hành cùng bé tốt nhất trong thời gian tới.',
    replied_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  }
];

const PROFANITY_WORDS = ['lừa đảo', 'mất dạy', 'chửi thề', 'ngu', 'dốt', 'bịp bợm', 'vô đạo đức', 'láo'];

export function hasProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_WORDS.some((word) => lowerText.includes(word));
}

class FakeReviewsDb {
  private records: Review[] = [];

  constructor() {
    this.records = [...INITIAL_REVIEWS];
  }

  // Helper to recalculate tutor rating & total_reviews (like SQL trigger)
  private updateTutorStats(tutorId: number) {
    const tutorReviews = this.records.filter((r) => r.reviewee_id === tutorId && r.is_public);
    const count = tutorReviews.length;
    const avg = count > 0 ? tutorReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    const tutor = fakeTutors.records.find((t) => t.id === tutorId);
    if (tutor) {
      tutor.rating = avg;
      tutor.total_reviews = count;
    }
  }

  async getAllReviews() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.records;
  }

  async getTutorReviews(tutorId: number) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Tutors can see their reviews (even if is_public=false in dashboard, but public details page only sees is_public=true)
    return this.records.filter((r) => r.reviewee_id === tutorId);
  }

  async getPublicReviewsForTutor(tutorId: number) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.records.filter((r) => r.reviewee_id === tutorId && r.is_public);
  }

  async createReview(payload: {
    session_id: number;
    reviewer_id: number;
    reviewer_name: string;
    reviewer_avatar?: string;
    reviewee_id: number;
    rating: number;
    comment: string;
    is_reported?: boolean;
    private_feedback?: string;
  }) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check duplicate
    const exists = this.records.find((r) => r.session_id === payload.session_id);
    if (exists) {
      throw new Error('Buổi học này đã được đánh giá trước đó.');
    }

    // Auto moderation checks
    const hasBadWords = hasProfanity(payload.comment) || hasProfanity(payload.private_feedback || '');
    let isPublic = true;

    if (hasBadWords) {
      isPublic = false; // Auto hide for profanity
    }

    const newReview: Review = {
      id: this.records.length + 1,
      ...payload,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.records.unshift(newReview);
    
    // Update session review flag
    await fakeSessions.updateSessionReviewStatus(payload.session_id, true);

    // Update tutor avg rating if it is public
    this.updateTutorStats(payload.reviewee_id);

    return {
      success: true,
      review: newReview,
      auto_hidden: !isPublic,
      reason: hasBadWords ? 'Phát hiện từ ngữ nhạy cảm' : null
    };
  }

  async replyToReview(reviewId: number, reply: string) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const review = this.records.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Không tìm thấy đánh giá.');
    }

    review.reply = reply;
    review.replied_at = new Date().toISOString();
    review.updated_at = new Date().toISOString();

    return {
      success: true,
      review
    };
  }

  async toggleReviewPublic(reviewId: number, isPublic: boolean) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const review = this.records.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error('Không tìm thấy đánh giá.');
    }

    review.is_public = isPublic;
    review.updated_at = new Date().toISOString();

    // Trigger recalculation
    this.updateTutorStats(review.reviewee_id);

    return {
      success: true,
      review
    };
  }
}

export const fakeReviews = new FakeReviewsDb();
