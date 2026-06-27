import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';
import { ApiPermissionError } from '@/lib/api-client';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Không retry khi lỗi 401/403 — chỉ retry tối đa 1 lần với lỗi mạng/server khác
        retry: (failureCount, error) => {
          if (error instanceof ApiPermissionError) return false;
          return failureCount < 1;
        }
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
