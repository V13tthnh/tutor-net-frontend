export type SessionStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export interface Session {
  id: number;
  tutor_id: number;
  tutor_name: string;
  student_id: number;
  student_name: string;
  booked_by: number;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  price: number;
  subject: string;
  has_review: boolean;
}

export interface Review {
  id: number;
  session_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewee_id: number;
  rating: number;
  comment: string;
  is_public: boolean;
  reply?: string;
  replied_at?: string;
  is_reported?: boolean;
  private_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewPayload {
  session_id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewee_id: number;
  rating: number;
  comment: string;
  is_reported?: boolean;
  private_feedback?: string;
}

export interface ReplyReviewPayload {
  id: number;
  reply: string;
}

export interface TogglePublicPayload {
  id: number;
  is_public: boolean;
}

export interface SessionsFilters {
  role?: string;
  userId?: number;
}
