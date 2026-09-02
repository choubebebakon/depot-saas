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

                // Le Patron peut sélectionner un dépôt. Les autres rôles restent
                // strictement attachés au depotId porté par leur profil.
                if (user?.role !== 'PATRON' && user?.depotId) {
                    const profileDepot = data.find((d) => d.id === user.depotId);
                    setDepotActif(profileDepot || null);
                } else if (user?.role === 'PATRON') {
                    const saved = localStorage.getItem(ACTIVE_DEPOT_STORAGE_KEY);
                    const found = saved ? data.find((depot) => depot.id === saved) : null;
                    setDepotActif(found || data[0] || null);
                } else {
                    setDepotActif(null);
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
    }, [depotActif?.id, queryClient]);

    const changerDepot = (depot) => {
        if (user?.role !== 'PATRON') {
            console.warn(`[SECURITY] Changement de dépôt refusé pour le rôle ${user?.role || 'inconnu'}.`);
            return;
        }

        const allowedDepot = depots.find((item) => item.id === depot?.id);
        if (!allowedDepot) {
            console.warn('[SECURITY] Dépôt demandé absent du tenant authentifié.');
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
