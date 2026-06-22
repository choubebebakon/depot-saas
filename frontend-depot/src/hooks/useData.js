import { useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { buildUrl } from '../api/axios';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

function flattenParams(p) {
  if (!p) return '';
  try { return JSON.stringify(p); } catch { return ''; }
}

export function useData(endpoint, options = {}) {
  const { params = {}, enabled = true, staleTime = 1000 * 60 * 5, metier, refetchInterval } = options;
  const queryClient = useQueryClient();
  const abortRef = useRef(null);

  const url = useMemo(
    () => (metier ? buildUrl(metier, endpoint) : endpoint),
    [metier, endpoint]
  );

  const paramKey = useMemo(() => flattenParams(params), [params]);
  const queryKey = useMemo(() => [endpoint, params, metier], [endpoint, paramKey, metier]);

  const fetchFn = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const res = await api.get(url, { params: cleanParams(params), signal: abortRef.current.signal });
    return res.data;
  }, [url, paramKey]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: enabled && !!url,
    staleTime,
    refetchInterval,
    retry: 0,
  });

  const mutationOpts = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] }),
  };

  const create = useMutation({
    mutationFn: async (body) => { const r = await api.post(url, body); return r.data; },
    ...mutationOpts,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...body }) => { const r = await api.put(`${url}/${id}`, body); return r.data; },
    ...mutationOpts,
  });

  const remove = useMutation({
    mutationFn: async (id) => { const r = await api.delete(`${url}/${id}`); return r.data; },
    ...mutationOpts,
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch,
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isRemoving: remove.isPending,
  };
}

export default useData;
