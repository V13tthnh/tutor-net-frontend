// ─── Legacy types (kept for tutor-reviews-tab / session-listing) ────────────
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

// ─── Real backend AdminReviewResponse ────────────────────────────────────────
// Matches: GET /api/v1/admin/reviews (AdminReviewController)
export interface AdminReviewResponse {
  id: number;
  /** Mã hợp đồng liên quan, ví dụ: "HD-2026-42667A2B" */
  contractNumber: string;
  /** ID hợp đồng để link sang trang chi tiết */
  contractId: number;
  /** Tên gia sư */
  tutorName: string;
  /** Email gia sư */
  tutorEmail: string;
  /** Tên người đánh giá (null nếu là khách vãng lai) */
  reviewerName: string | null;
  /** Nếu là khách vãng lai (Magic Link), trường này = true */
  isGuestReview: boolean;
  /** Số sao: 1-5 */
  rating: number;
  /** Nội dung nhận xét */
  comment: string;
  /** true = hiển thị công khai, false = đã ẩn */
  isPublic: boolean;
  /** ISO timestamp */
  createdAt: string;
}

export interface AdminReviewFilters {
  rating?: number;
  isPublic?: boolean;
  search?: string;
  page?: number;
  size?: number;
}
