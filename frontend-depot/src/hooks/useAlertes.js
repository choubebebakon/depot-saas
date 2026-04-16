import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export function useAlertes(tenantId, siteId) {
    const [totalAlertes, setTotalAlertes] = useState(0);
    const [alertesCritiques, setAlertesCritiques] = useState(0);

    const fetchCount = useCallback(async () => {
        if (!tenantId) return;
        const params = { tenantId, ...(siteId ? { siteId } : {}) };
        try {
            const [resStock, resDLC] = await Promise.all([
                api.get('/stocks/alertes', { params }),
                api.get('/dlc/alertes', { params }),
            ]);
            const stocks = Array.isArray(resStock.data) ? resStock.data : [];
            const dlcs = Array.isArray(resDLC.data) ? resDLC.data : [];

            setTotalAlertes(stocks.length + dlcs.length);
            setAlertesCritiques(
                stocks.filter(a => a.quantite <= 0).length +
                dlcs.filter(a => a.statutDLC === 'EXPIRE').length
            );
        } catch (err) {
            console.error('Erreur comptage alertes:', err);
        }
    }, [tenantId, siteId]);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return { totalAlertes, alertesCritiques };
}