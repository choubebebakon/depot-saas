import { createContext, useCallback, useEffect, useState } from 'react';
import { fetchTenant } from '../services/tenantService';

export const TenantContext = createContext(null);

const ACTIVE_DEPOT_STORAGE_KEY = 'depot_actif_id';

function normalizeDepotId(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized !== 'all' && normalized !== 'null' && normalized !== 'undefined'
    ? normalized
    : null;
}

function resolveInitialDepot(depots, currentDepotId) {
  if (!Array.isArray(depots) || depots.length === 0) return null;

  const jwtDepotId = normalizeDepotId(currentDepotId);
  if (jwtDepotId) {
    return depots.find((depot) => depot.id === jwtDepotId) ?? null;
  }

  const savedDepotId = normalizeDepotId(localStorage.getItem(ACTIVE_DEPOT_STORAGE_KEY));
  if (savedDepotId) {
    const savedDepot = depots.find((depot) => depot.id === savedDepotId);
    if (savedDepot) return savedDepot;
  }

  return depots[0];
}

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [currentDepot, setCurrentDepotState] = useState(null);
  const [depots, setDepots] = useState([]);
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const setCurrentDepot = useCallback((depot) => {
    setCurrentDepotState(depot ?? null);

    if (depot?.id) {
      localStorage.setItem(ACTIVE_DEPOT_STORAGE_KEY, depot.id);
    } else {
      localStorage.removeItem(ACTIVE_DEPOT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchTenant()
      .then((data) => {
        if (!mounted) return;

        const nextDepots = Array.isArray(data?.depots) ? data.depots : [];
        const nextDepot = resolveInitialDepot(nextDepots, data?.currentDepotId);

        setTenant(data?.tenant ?? null);
        setDepots(nextDepots);
        setCurrentDepotState(nextDepot);
        setPlan(data?.plan ?? 'free');

        // Un employé est verrouillé sur le dépôt porté par le JWT ; pour un
        // manager multi-dépôts, on conserve le dépôt actif choisi dans l'UI.
        if (nextDepot?.id) {
          localStorage.setItem(ACTIVE_DEPOT_STORAGE_KEY, nextDepot.id);
        } else {
          localStorage.removeItem(ACTIVE_DEPOT_STORAGE_KEY);
        }
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

  const switchDepot = useCallback((depotId) => {
    const normalizedDepotId = normalizeDepotId(depotId);
    const depot = depots.find((item) => item.id === normalizedDepotId);

    if (!depot) {
      console.warn(`[TenantContext] Depot "${depotId}" not found in authenticated tenant.`);
      return;
    }

    setCurrentDepot(depot);
  }, [depots, setCurrentDepot]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        currentDepot,
        setCurrentDepot,
        switchDepot,
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
