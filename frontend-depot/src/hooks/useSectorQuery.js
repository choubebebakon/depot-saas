import { useQuery } from '@tanstack/react-query';

/**
 * Unified custom hook for useQuery with optimal defaults (all sectors).
 * @param {Array|string} queryKey - The React Query key
 * @param {Function} queryFn - The fetching function
 * @param {Object} [options] - Additional useQuery options
 */
export function useSectorQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    ...options,
  });
}
