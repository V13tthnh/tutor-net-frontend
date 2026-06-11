export type { Tutor } from '@/constants/mock-api-tutors';

export type TutorFilters = {
  page?: number;
  limit?: number;
  subjects?: string;
  levels?: string;
  province?: string;
  gender?: string;
  teaching_method?: string;
  search?: string;
  sort?: string;
};

export type TutorsResponse = {
  success: boolean;
  time: string;
  total_tutors: number;
  offset: number;
  limit: number;
  tutors: import('@/constants/mock-api-tutors').Tutor[];
};

export type TutorByIdResponse = {
  success: boolean;
  time?: string;
  message?: string;
  tutor?: import('@/constants/mock-api-tutors').Tutor;
};

export type SubjectOption = {
  id: number;
  name: string;
};

export type GenderOption = {
  value: string;
  label: string;
};

export type TeachingModeOption = {
  value: string;
  label: string;
};

export type FilterOptionsResponse = {
  subjects: SubjectOption[];
  provinces: string[];
  genders: GenderOption[];
  teachingModes: TeachingModeOption[];
};

