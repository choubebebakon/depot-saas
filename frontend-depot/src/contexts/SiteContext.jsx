import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
    const { tenantId, isAuthenticated } = useAuth();
    const [sites, setSites] = useState([]);
    const [siteActif, setSiteActif] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !tenantId) return;

        const fetchSites = async () => {
            try {
                const res = await api.get('/sites', { params: { tenantId } });
                const data = Array.isArray(res.data) ? res.data : [];
                setSites(data);
                // Restaure le dernier site choisi ou prend le premier
                const saved = localStorage.getItem('depot_site_actif');
                const found = saved ? data.find(s => s.id === saved) : null;
                setSiteActif(found || data[0] || null);
            } catch (err) {
                console.error('Erreur chargement sites:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSites();
    }, [tenantId, isAuthenticated]);

    const changerSite = (site) => {
        setSiteActif(site);
        localStorage.setItem('depot_site_actif', site.id);
    };

    return (
        <SiteContext.Provider value={{
            sites,
            siteActif,
            siteId: siteActif?.id || null,
            changerSite,
            loading,
        }}>
            {children}
        </SiteContext.Provider>
    );
}

export function useSite() {
    const ctx = useContext(SiteContext);
    if (!ctx) throw new Error('useSite doit être dans SiteProvider');
    return ctx;
}