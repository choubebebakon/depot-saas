/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DepotContext = createContext(null);
const ACTIVE_DEPOT_STORAGE_KEY = 'depot_actif_id';

export function DepotProvider({ children }) {
    const { tenantId, isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();
    const [depots, setDepots] = useState([]);
    const [depotActif, setDepotActif] = useState(null);
    const [loading, setLoading] = useState(true);
    const previousDepotIdRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !tenantId) return;

        const fetchDepots = async () => {
            try {
                const res = await api.get('/depots', { params: { tenantId } });
                const data = Array.isArray(res.data) ? res.data : [];
                setDepots(data);

                // La liste est scopée serveur : PATRON = tous les dépôts du
                // tenant, autres rôles = dépôt principal + affectations
                // multi-établissements (§13 : comptable central, gérant
                // multi-sites). Le dernier établissement actif est restauré.
                if (data.length === 0) {
                    setDepotActif(null);
                } else if (user?.role !== 'PATRON' && data.length === 1) {
                    // Utilisateur mono-établissement : verrouillé sur son dépôt.
                    const profileDepot = data.find((d) => d.id === user.depotId) || data[0];
                    setDepotActif(profileDepot);
                    localStorage.setItem(ACTIVE_DEPOT_STORAGE_KEY, profileDepot.id);
                } else {
                    const saved = localStorage.getItem(ACTIVE_DEPOT_STORAGE_KEY);
                    const found = saved ? data.find((depot) => depot.id === saved) : null;
                    setDepotActif(found || data.find((d) => d.id === user?.depotId) || data[0]);
                }
            } catch (err) {
                console.error('Erreur chargement dépôts:', err);
                setDepotActif(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDepots();
    }, [tenantId, isAuthenticated, user?.role, user?.depotId]);

    useEffect(() => {
        const currentDepotId = depotActif?.id || null;
        const previousDepotId = previousDepotIdRef.current;

        if (!currentDepotId || currentDepotId === previousDepotId) return;

        if (previousDepotId) {
            queryClient.removeQueries({
                predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes(previousDepotId),
            });
        }

        queryClient.invalidateQueries();
        previousDepotIdRef.current = currentDepotId;
        localStorage.setItem(ACTIVE_DEPOT_STORAGE_KEY, currentDepotId);
    }, [depotActif?.id, queryClient]);

    const changerDepot = (depot) => {
        // La bascule est autorisée pour tous les rôles, mais uniquement vers
        // un dépôt présent dans la liste scopée serveur (dépôts autorisés
        // pour cet utilisateur). Toute tentative hors périmètre est refusée.
        const allowedDepot = depots.find((item) => item.id === depot?.id);
        if (!allowedDepot) {
            console.warn('[SECURITY] Dépôt demandé absent du périmètre autorisé.');
            return;
        }

        setDepotActif(allowedDepot);
        localStorage.setItem(ACTIVE_DEPOT_STORAGE_KEY, allowedDepot.id);
        window.dispatchEvent(new CustomEvent('gestock:depot-changed', {
            detail: { depotId: allowedDepot.id },
        }));
    };

    return (
        <DepotContext.Provider value={{
            depots,
            depotActif,
            depotId: depotActif?.id || null,
            changerDepot,
            loading,
        }}>
            {children}
        </DepotContext.Provider>
    );
}

export const useDepot = () => useContext(DepotContext);
