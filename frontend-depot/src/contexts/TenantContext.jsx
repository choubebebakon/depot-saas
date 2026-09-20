import { createContext, useEffect, useState } from 'react';
import { fetchTenant } from '../services/tenantService';

export const TenantContext = createContext(null);

// NOTE (correctif du 9 septembre 2026) : ce contexte ne gère plus la
// sélection du dépôt actif. DepotContext (src/contexts/DepotContext.jsx)
// est désormais l'UNIQUE source de vérité pour depotActif / la clé
// localStorage 'depot_actif_id'. Avoir deux contextes qui écrivaient tous
// les deux cette même clé en parallèle créait une condition de course qui
// faisait réapparaître les erreurs 403 "Accès refusé à ce dépôt" de façon
// intermittente pour PATRON. Ne pas réintroduire de logique de dépôt ici —
// utiliser useDepot() pour tout ce qui concerne le dépôt actif.
export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [depots, setDepots] = useState([]);
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    fetchTenant()
      .then((data) => {
        if (!mounted) return;
        setTenant(data?.tenant ?? null);
        setDepots(Array.isArray(data?.depots) ? data.depots : []);
        setPlan(data?.plan ?? 'free');
      })
      .catch((err) => {
        if (mounted) setError(err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        depots,
        plan,
        isLoading,
        error,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}