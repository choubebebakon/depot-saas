import { useCallback } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import api from '../api/axios';

/**
 * Hook auth enrichi avec refreshToken et permissions embarquées.
 * Wrapper autour de AuthContext.
 */
export function useAuth() {
  const ctx = useAuthContext();

  const refreshToken = useCallback(async () => {
    const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
    const token = data.access_token || data.accessToken;
    if (token) {
      localStorage.setItem('depot_token', token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    return token || null;
  }, []);

  return {
    ...ctx,
    refreshToken,
    userId: ctx.user?.id || null,
    email: ctx.user?.email || null,
    nom: ctx.user?.nom || ctx.user?.name || null,
  };
}

export default useAuth;
