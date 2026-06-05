import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export function useAlertes(tenantId, depotId, active = true) {
    const queryClient = useQueryClient();

    const { data: stocksAlertes = [], isLoading: loadingStocks } = useQuery({
        queryKey: ['stocks-alertes', tenantId, depotId],
        queryFn: async () => {
            const params = { tenantId, ...(depotId ? { depotId } : {}) };
            const res = await api.get('/stocks/alertes', { params });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId,
        refetchInterval: active ? 60000 : false, // 1 minute si actif, sinon pas de polling
    });

    const { data: dlcsAlertes = [], isLoading: loadingDLCs } = useQuery({
        queryKey: ['dlc-alertes', tenantId, depotId],
        queryFn: async () => {
            const params = { tenantId, ...(depotId ? { depotId } : {}) };
            const res = await api.get('/dlc/alertes', { params });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId,
        refetchInterval: active ? 60000 : false,
    });

    const refetch = () => {
        queryClient.invalidateQueries(['stocks-alertes', tenantId, depotId]);
        queryClient.invalidateQueries(['dlc-alertes', tenantId, depotId]);
    };

    const totalAlertes = stocksAlertes.length + dlcsAlertes.length;
    const alertesCritiques =
        stocksAlertes.filter(a => a.quantite <= 0).length +
        dlcsAlertes.filter(a => a.statutDLC === 'EXPIRE').length;

    return { 
        totalAlertes, 
        alertesCritiques, 
        stocksAlertes, 
        dlcsAlertes, 
        loading: loadingStocks || loadingDLCs,
        refetch
    };
}
