import { useEffect } from 'react';
import { connectRealtime, disconnectRealtime } from './realtimeClient';

const RESOURCE_QUERY_ALIASES = {
  stock: ['stock', 'stocks', 'article', 'articles'],
  stocks: ['stock', 'stocks', 'article', 'articles'],
  article: ['article', 'articles', 'stock', 'stocks'],
  articles: ['article', 'articles', 'stock', 'stocks'],
  vente: ['vente', 'ventes', 'caisse', 'caisses', 'stock', 'stocks', 'article', 'articles', 'dashboard'],
  ventes: ['vente', 'ventes', 'caisse', 'caisses', 'stock', 'stocks', 'article', 'articles', 'dashboard'],
  caisse: ['caisse', 'caisses', 'vente', 'ventes', 'dashboard'],
  client: ['client', 'clients'],
  clients: ['client', 'clients'],
  fournisseur: ['fournisseur', 'fournisseurs'],
  fournisseurs: ['fournisseur', 'fournisseurs'],
  depense: ['depense', 'depenses', 'caisse', 'caisses', 'dashboard'],
  depenses: ['depense', 'depenses', 'caisse', 'caisses', 'dashboard'],
  promotion: ['promotion', 'promotions', 'article', 'articles'],
  promotions: ['promotion', 'promotions', 'article', 'articles'],
  tournee: ['tournee', 'tournees', 'stock', 'stocks'],
  tournees: ['tournee', 'tournees', 'stock', 'stocks'],
  consigne: ['consigne', 'consignes', 'stock', 'stocks'],
  consignes: ['consigne', 'consignes', 'stock', 'stocks'],
  categorie: ['categorie', 'categories', 'article', 'articles'],
  categories: ['categorie', 'categories', 'article', 'articles'],
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

    connectRealtime({
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

    return undefined;
  }, [depotId, enabled, onStatus, queryClient, tenantId, token]);

  return { disconnectRealtime };
}
