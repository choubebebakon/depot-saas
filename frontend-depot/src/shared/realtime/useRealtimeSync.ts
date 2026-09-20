import { useEffect, useRef } from 'react';
import { connectRealtime, disconnectRealtime } from './realtimeClient.ts'; 
import { useAuth } from '../../contexts/AuthContext';


const RESOURCE_QUERY_ALIASES = {
  stock: ['stock', 'stocks', 'article', 'articles', 'rapports'],
  stocks: ['stock', 'stocks', 'article', 'articles', 'rapports'],
  article: ['article', 'articles', 'stock', 'stocks', 'rapports'],
  articles: ['article', 'articles', 'stock', 'stocks', 'rapports'],
  vente: ['vente', 'ventes', 'caisse', 'caisses', 'stock', 'stocks', 'article', 'articles', 'dashboard', 'rapports'],
  ventes: ['vente', 'ventes', 'caisse', 'caisses', 'stock', 'stocks', 'article', 'articles', 'dashboard', 'rapports'],
  caisse: ['caisse', 'caisses', 'vente', 'ventes', 'dashboard'],
  client: ['client', 'clients', 'rapports'],
  clients: ['client', 'clients', 'rapports'],
  fournisseur: ['fournisseur', 'fournisseurs'],
  fournisseurs: ['fournisseur', 'fournisseurs'],
  depense: ['depense', 'depenses', 'caisse', 'caisses', 'dashboard', 'rapports'],
  depenses: ['depense', 'depenses', 'caisse', 'caisses', 'dashboard', 'rapports'],
  promotion: ['promotion', 'promotions', 'article', 'articles'],
  promotions: ['promotion', 'promotions', 'article', 'articles'],
  tournee: ['tournee', 'tournees', 'stock', 'stocks', 'rapports'],
  tournees: ['tournee', 'tournees', 'stock', 'stocks', 'rapports'],
  // Workflow tournée (chargement → départ → rapprochement → clôture) : une
  // mutation impacte aussi le stock, la caisse, le dashboard et les rapports.
  'tournee-workflow': ['tournee-workflow', 'tournee', 'tournees', 'stock', 'stocks', 'caisse', 'caisses', 'dashboard', 'rapports'],
  consigne: ['consigne', 'consignes', 'stock', 'stocks', 'rapports'],
  consignes: ['consigne', 'consignes', 'stock', 'stocks', 'rapports'],
  categorie: ['categorie', 'categories', 'article', 'articles'],
  categories: ['categorie', 'categories', 'article', 'articles'],
  reception: ['reception', 'receptions', 'fournisseur', 'fournisseurs', 'depot-boissons-receptions'],
  receptions: ['reception', 'receptions', 'fournisseur', 'fournisseurs', 'depot-boissons-receptions'],
  commande: ['commande', 'commandes', 'achats', 'depot-boissons'],
  commandes: ['commande', 'commandes', 'achats', 'depot-boissons'],
  rapport: ['rapport', 'rapports', 'report', 'depot-boissons'],
  rapports: ['rapport', 'rapports', 'report', 'depot-boissons'],
  audit: ['audit', 'journal', 'event', 'activity'],
  // Filet de sécurité pour les anciens events émis au niveau du namespace.
  'depot-boissons': ['depot-', 'rapports'],
};

function resourceMatches(queryKey, aliases) {
  const values = Array.isArray(queryKey) ? queryKey : [queryKey];
  return values.some((value) => {
    const normalized = String(value ?? '').toLowerCase();
    return aliases.some((alias) => normalized === alias || normalized.includes(alias));
  });
}

export function useRealtimeSync({ tenantId = null, depotId = null, queryClient, enabled = true, onStatus, token: tokenProp } = {}) {
  const { token: authToken } = useAuth();
  const token = tokenProp ?? authToken;

  // 1. STABILISATION DU CALLBACK
  // On stocke onStatus dans une ref pour toujours avoir la dernière version 
  // sans jamais déclencher de re-rendu ou de reconnexion WebSocket.
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    if (!enabled || !token || !queryClient) {
      disconnectRealtime();
      return undefined;
    }

    connectRealtime({
      token,
      depotId,
      onStatus: (status, error) => {
        if (onStatusRef.current) {
          onStatusRef.current(status, error);
        }
      },
      onEvent: (event) => {
        // 2. ISOLATION DES ERREURS
        // Empêche un event corrompu du backend de faire crasher React.
        try {
          // Sécurité Tenant (SaaS multitenant)
          if (!event?.tenantId || (tenantId && event.tenantId !== tenantId)) return;
          
          // Sécurité Dépôt : on s'assure que depotId n'est pas undefined avant de bloquer
          if (event.depotId !== undefined && event.depotId !== null && event.depotId !== depotId) return;

          const resource = String(event.resource ?? '').toLowerCase().split(':').pop();
          const aliases = RESOURCE_QUERY_ALIASES[resource] ?? [resource];
          
          if (!aliases[0]) return;

          // React Query gère intelligemment le "batching" (regroupement) de ces invalidations
          queryClient.invalidateQueries({
            predicate: ({ queryKey }) => resourceMatches(queryKey, aliases),
          });
        } catch (error) {
          console.error('[RealtimeSync] Erreur lors du traitement de l\'événement:', error);
        }
      },
    });

    return () => {
      disconnectRealtime();
    };
  }, [depotId, enabled, queryClient, tenantId, token]); 
  // onStatus a été retiré des dépendances grâce au useRef !

  return { disconnectRealtime };
}