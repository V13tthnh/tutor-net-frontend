import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsNativeArrayOf
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  name: parseAsString,
  keyword: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  roles: parseAsNativeArrayOf(parseAsString),
  status: parseAsNativeArrayOf(parseAsString),
  sortBy: parseAsString,
  sortDir: parseAsString,
  sort: parseAsString
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
