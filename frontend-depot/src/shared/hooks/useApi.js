import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFunc, deps = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFunc();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useApiMutation(apiFunc) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFunc(payload);
      setData(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { mutate, loading, error, data };
}
