import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DepotContext = createContext(null);

export function DepotProvider({ children }) {
    const { tenantId, isAuthenticated } = useAuth();
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

                const saved = localStorage.getItem('depot_actif_id');
                const found = saved ? data.find((depot) => depot.id === saved) : null;
                setDepotActif(found || data[0] || null);
            } catch (err) {
                console.error('Erreur chargement dépôts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDepots();
    }, [tenantId, isAuthenticated]);

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
        setDepotActif(depot);
        if (depot) {
            localStorage.setItem('depot_actif_id', depot.id);
        }
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
