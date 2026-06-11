export interface Subject {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  children?: Subject[];
}

export interface SubjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
}

/** Filters cho API GET /admin/subjects?keyword=&isActive= */
export interface SubjectListFilters {
  keyword?: string;
  isActive?: boolean;
}

export interface SubjectTreeFilters {
  search?: string;
}

export interface SubjectResponse {
  success: boolean;
  time: string;
  message: string;
  total_subjects: number;
  offset: number;
  limit: number;
  subjects: Subject[];
}

/** Response cho API GET /admin/subjects — flat list, không phân trang */
export interface SubjectListResponse {
  success: boolean;
  message: string;
  data: Subject[];
  timestamp?: string;
}

export interface SubjectTreeResponse {
  success: boolean;
  message: string;
  data: Subject[];
  timestamp?: string;
}

export interface SubjectStatsResponse {
  success: boolean;
  totalSubjects: number;
  activeSubjects: number;
  inactiveSubjects: number;
}

export interface CreateSubjectPayload {
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export type UpdateSubjectPayload = Partial<CreateSubjectPayload>;
