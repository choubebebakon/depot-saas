import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useAlertes(tenantId, depotId) {
    const { data: stocksAlertes = [] } = useQuery({
        queryKey: ['stocks-alertes', tenantId, depotId],
        queryFn: async () => {
            const params = { tenantId, ...(depotId ? { depotId } : {}) };
            const res = await api.get('/stocks/alertes', { params });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId,
        refetchInterval: 30000, // 30 secondes
    });

    const { data: dlcsAlertes = [] } = useQuery({
        queryKey: ['dlc-alertes', tenantId, depotId],
        queryFn: async () => {
            const params = { tenantId, ...(depotId ? { depotId } : {}) };
            const res = await api.get('/dlc/alertes', { params });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId,
        refetchInterval: 30000,
    });

    const totalAlertes = stocksAlertes.length + dlcsAlertes.length;
    const alertesCritiques = 
        stocksAlertes.filter(a => a.quantite <= 0).length +
        dlcsAlertes.filter(a => a.statutDLC === 'EXPIRE').length;

    return { totalAlertes, alertesCritiques, stocksAlertes, dlcsAlertes };
}




