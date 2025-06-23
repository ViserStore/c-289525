
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  cacheTime?: number;
  staleTime?: number;
}

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  cacheTime = 300000, // 5 minutes
  staleTime = 30000,   // 30 seconds
  ...options
}: OptimizedQueryOptions<T>) => {
  return useQuery({
    queryKey,
    queryFn,
    gcTime: cacheTime,
    staleTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    ...options
  });
};
