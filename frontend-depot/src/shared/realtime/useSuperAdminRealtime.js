import { useEffect, useRef } from 'react';
import { connectSuperAdminRealtime } from './superAdminRealtime';

export function useSuperAdminRealtime({ token, queryClient, enabled = true, onStatus } = {}) {
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  useEffect(() => {
    if (!enabled || !token || !queryClientRef.current) return undefined;

    const socket = connectSuperAdminRealtime({
      token,
      onStatus,
      onEvent: (event) => {
        if (!event?.type) return;

        const client = queryClientRef.current;
        client.invalidateQueries({
          predicate: ({ queryKey }) => {
            const key = Array.isArray(queryKey) ? queryKey.map(String) : [String(queryKey)];
            return key.some((part) =>
              part === 'admin-users' ||
              part.startsWith('admin-analytics') ||
              part === 'admin-stats' ||
              part === 'admin-metrics' ||
              part === 'admin-tenants' ||
              part === 'admin-transactions'
            );
          },
        });
      },
    });

    return () => socket?.disconnect();
  }, [enabled, token, onStatus]);

  return null;
}
