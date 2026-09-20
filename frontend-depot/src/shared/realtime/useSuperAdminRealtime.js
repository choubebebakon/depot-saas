import { useEffect, useRef } from 'react';
import { connectSuperAdminRealtime } from './superAdminRealtime';
import { useAuth } from "../../contexts/AuthContext";


export function useSuperAdminRealtime({ token: tokenProp, queryClient, enabled = true, onStatus } = {}) {
  const { token: authToken } = useAuth();
  const token = tokenProp ?? authToken;

  // 1. Stabilisation du queryClient
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // 2. Stabilisation du callback onStatus pour éviter la boucle de re-connexion
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    if (!enabled || !token || !queryClientRef.current) return undefined;

    // Protection contre le double-mount de React StrictMode (développement).
    // On retarde la création du socket d'un tick pour que le cleanup du
    // premier mount ait le temps de s'exécuter et d'annuler la connexion
    // avant qu'elle ne soit réellement ouverte.
    let socket = null;
    let cancelled = false;

    const timerId = setTimeout(() => {
      if (cancelled) return;

      socket = connectSuperAdminRealtime({
        token,
        onStatus: (status, error) => {
          if (!cancelled && onStatusRef.current) {
            onStatusRef.current(status, error);
          }
        },
        onEvent: (event) => {
          if (cancelled) return;
          // 3. Isolation des erreurs d'événements backend
          try {
            if (!event?.type) return;

            const client = queryClientRef.current;
            if (!client) return;

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
          } catch (err) {
            console.error('[SuperAdminRealtime] Erreur lors du traitement de l\'événement:', err);
          }
        },
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      // Déconnexion douce : socket peut être null si le timer n'a pas encore tiré
      socket?.disconnect();
    };
  }, [enabled, token]); // onStatus retiré des dépendances !

  return null;
}