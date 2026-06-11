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
  createdAt: string;
  updatedAt: string;
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
