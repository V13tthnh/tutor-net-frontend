import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const classSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
  subjectId: parseAsInteger,
  teachingMode: parseAsString,
  sort: parseAsString.withDefault('createdAt:desc')
};

export const classSearchParamsCache = createSearchParamsCache(classSearchParams);
export const serializeClassParams = createSerializer(classSearchParams);
