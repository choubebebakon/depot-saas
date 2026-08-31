import { useEffect } from 'react';
import { connectRealtime, disconnectRealtime } from './realtimeClient';

const RESOURCE_QUERY_ALIASES = {
  stock: ['stock', 'stocks'], stocks: ['stock', 'stocks'],
  vente: ['vente', 'ventes'], ventes: ['vente', 'ventes'],
  caisse: ['caisse', 'caisses'],
  client: ['client', 'clients'], clients: ['client', 'clients'],
  fournisseur: ['fournisseur', 'fournisseurs'], fournisseurs: ['fournisseur', 'fournisseurs'],
  depense: ['depense', 'depenses'], depenses: ['depense', 'depenses'],
  promotion: ['promotion', 'promotions'], promotions: ['promotion', 'promotions'],
  tournee: ['tournee', 'tournees'], tournees: ['tournee', 'tournees'],
  consigne: ['consigne', 'consignes'], consignes: ['consigne', 'consignes'],
  categorie: ['categorie', 'categories'], categories: ['categorie', 'categories'],
};

function resourceMatches(queryKey, aliases) {
  const values = Array.isArray(queryKey) ? queryKey : [queryKey];
  return values.some((value) => {
    const normalized = String(value ?? '').toLowerCase();
    return aliases.some((alias) => normalized === alias || normalized.includes(alias));
  });
}

export function useRealtimeSync({ token, tenantId = null, depotId = null, queryClient, enabled = true, onStatus } = {}) {
  useEffect(() => {
    if (!enabled || !token || !queryClient) return undefined;

    const socket = connectRealtime({
      token,
      depotId,
      onStatus,
      onEvent: (event) => {
        if (!event?.tenantId || (tenantId && event.tenantId !== tenantId)) return;
        if (event.depotId !== null && event.depotId !== depotId) return;

        const resource = String(event.resource ?? '').toLowerCase().split(':').pop();
        const aliases = RESOURCE_QUERY_ALIASES[resource] ?? [resource];
        if (!aliases[0]) return;

        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => resourceMatches(queryKey, aliases),
        });
      },
    });

    return () => {
      // Le singleton reste actif entre les changements de page.
      void socket;
    };
  }, [depotId, enabled, onStatus, queryClient, tenantId, token]);

  return { disconnectRealtime };
}
