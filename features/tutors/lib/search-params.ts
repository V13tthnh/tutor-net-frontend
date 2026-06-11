import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const tutorSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
  search: parseAsString,
  subjects: parseAsString,
  levels: parseAsString,
  province: parseAsString,
  gender: parseAsString,
  teaching_method: parseAsString,
  sort: parseAsString.withDefault('experience_years:desc')
};

export const tutorSearchParamsCache = createSearchParamsCache(tutorSearchParams);
export const serializeTutorParams = createSerializer(tutorSearchParams);
