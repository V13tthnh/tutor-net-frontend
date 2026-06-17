export interface ClassRequest {
  id: number;
  userId: number | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  subjectId: number;
  subjectName: string;
  gradeLevel: string;
  proposedPrice: number;
  hourlyRate: number | null;
  sessionsPerWeek: number;
  durationMinutes: number;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  province: string;
  ward: string;
  address: string;
  studentNotes: string;
  targetTutorId: number | null;
  targetTutorName: string | null;
  status: string;
  totalApplicants: number;
  hasAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRequestDropdown {
  id: number;
  classCode: string;
  subjectName: string;
  gradeLevel: string;
  proposedPrice: number;
}

export type ClassFilters = {
  page?: number;
  limit?: number;
  subjectId?: number;
  teachingMode?: string;
  sortBy?: string;
  sortDir?: string;
};

export type ClassRequestsResponse = {
  success: boolean;
  message: string;
  data: {
    content: ClassRequest[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
  timestamp: string;
};

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ClassRequestOwnResponse {
  id: number;
  classCode: string;
  subjectName: string;
  gradeLevel: string;
  proposedPrice: number;
  hourlyRate: number | null;
  teachingMode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  sessionsPerWeek: number;
  status: 'PENDING' | 'APPROVED' | 'MATCHED' | 'REJECTED' | 'CANCELLED' | 'PROCESSING' | string;
  createdAt: string;
  applicantsCount: number;
}

export interface ClassRequestOwnFilters {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortDir?: string;
}

export interface ClassApplicationResponse {
  id: number;
  classRequestId: number;
  tutorId: number;
  tutorName: string;
  tutorAvatarUrl: string | null;
  university: string;
  major: string;
  headline: string | null;
  experienceYears: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string | null;
  appliedAt: string;
}

