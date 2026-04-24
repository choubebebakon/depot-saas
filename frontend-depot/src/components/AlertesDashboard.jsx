import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

export default function AlertesDashboard() {
    const { tenantId } = useAuth();
    const { depotId } = useDepot();
    const [alertesStock, setAlertesStock] = useState([]);
    const [alertesDLC, setAlertesDLC] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reduit, setReduit] = useState(false);

    const fetchAlertes = useCallback(async () => {
        if (!tenantId) return;
        const params = { tenantId, ...(depotId ? { depotId } : {}) };
        try {
            const [resStock, resDLC] = await Promise.all([
                api.get('/stocks/alertes', { params }),
                api.get('/dlc/alertes', { params }),
            ]);
            setAlertesStock(Array.isArray(resStock.data) ? resStock.data : []);
            setAlertesDLC(Array.isArray(resDLC.data) ? resDLC.data : []);
        } catch (err) {
            console.error('Erreur alertes:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, depotId]);

    useEffect(() => {
        fetchAlertes();
        // Rafraîchit les alertes toutes les 2 minutes
        const interval = setInterval(fetchAlertes, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAlertes]);

    const totalAlertes = alertesStock.length + alertesDLC.length;
    const alertesCritiques = alertesStock.filter(a => a.quantite <= 0).length
        + alertesDLC.filter(a => a.statutDLC === 'EXPIRE').length;

    if (loading) return null;
    if (totalAlertes === 0) return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-xl">âœ…</span>
            <p className="text-emerald-400 font-semibold text-sm">
                Tous les stocks sont OK â€” Aucune alerte en cours
            </p>
        </div>
    );

    return (
        <div className={`rounded-2xl border mb-6 overflow-hidden ${alertesCritiques > 0
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-orange-500/10 border-orange-500/20'
            }`}>

            {/* Header cliquable */}
            <button
                onClick={() => setReduit(!reduit)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className={`text-xl ${alertesCritiques > 0 ? 'animate-bounce' : ''}`}>
                        {alertesCritiques > 0 ? 'ðŸš¨' : 'âš ï¸'}
                    </span>
                    <div className="text-left">
                        <p className={`font-black text-sm ${alertesCritiques > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                            {totalAlertes} alerte{totalAlertes > 1 ? 's' : ''} active{totalAlertes > 1 ? 's' : ''}
                            {alertesCritiques > 0 && ` â€” ${alertesCritiques} critique${alertesCritiques > 1 ? 's' : ''}`}
                        </p>
                        <p className="text-slate-400 text-xs">
                            {alertesStock.length} stock{alertesStock.length > 1 ? 's' : ''} critique{alertesStock.length > 1 ? 's' : ''}
                            {alertesDLC.length > 0 && ` Â· ${alertesDLC.length} DLC Ã  traiter`}
                        </p>
                    </div>
                </div>

                {/* Badges résumé */}
                <div className="flex items-center gap-2">
                    {alertesStock.filter(a => a.quantite <= 0).length > 0 && (
                        <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-lg">
                            {alertesStock.filter(a => a.quantite <= 0).length} rupture{alertesStock.filter(a => a.quantite <= 0).length > 1 ? 's' : ''}
                        </span>
                    )}
                    {alertesDLC.filter(a => a.statutDLC === 'EXPIRE').length > 0 && (
                        <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded-lg">
                            {alertesDLC.filter(a => a.statutDLC === 'EXPIRE').length} expiré{alertesDLC.filter(a => a.statutDLC === 'EXPIRE').length > 1 ? 's' : ''}
                        </span>
                    )}
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${reduit ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Contenu dépliable */}
            {!reduit && (
                <div className="px-5 pb-5 space-y-4">

                    {/* â”€â”€ Alertes Stock â”€â”€ */}
                    {alertesStock.length > 0 && (
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                ðŸ“¦ Stocks critiques
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {alertesStock.map(alerte => {
                                    const isRupture = alerte.quantite <= 0;
                                    return (
                                        <div key={alerte.id}
                                            className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${isRupture
                                                    ? 'bg-red-500/10 border-red-500/30'
                                                    : 'bg-orange-500/10 border-orange-500/30'
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-xs truncate">
                                                    {alerte.article?.famille?.emoji} {alerte.article?.designation}
                                                </p>
                                                <p className="text-slate-500 text-xs truncate">
                                                    {alerte.article?.format} â€” {alerte.Dépôt?.nom}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-black text-sm block ${isRupture ? 'text-red-400' : 'text-orange-400'}`}>
                                                    {isRupture ? 'RUPTURE' : `${alerte.quantite} u.`}
                                                </span>
                                                <span className="text-slate-600 text-xs">
                                                    seuil: {alerte.article?.seuilCritique}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* â”€â”€ Alertes DLC â”€â”€ */}
                    {alertesDLC.length > 0 && (
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                ðŸ“… DLC Ã  traiter
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {alertesDLC.map(lot => {
                                    const isExpire = lot.statutDLC === 'EXPIRE';
                                    const isUrgent = lot.statutDLC === 'URGENT';
                                    return (
                                        <div key={lot.id}
                                            className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${isExpire ? 'bg-red-500/10 border-red-500/30'
                                                    : isUrgent ? 'bg-orange-500/10 border-orange-500/30'
                                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-xs truncate">
                                                    {lot.article?.famille?.emoji} {lot.article?.designation}
                                                </p>
                                                <p className="text-slate-500 text-xs">
                                                    {lot.quantite} btl. â€” {lot.Dépôt?.nom}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`font-black text-xs block ${isExpire ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-yellow-400'
                                                    }`}>
                                                    {isExpire ? 'EXPIRÉ' : `J-${lot.joursRestants}`}
                                                </span>
                                                <span className="text-slate-600 text-xs">
                                                    {lot.dlc ? new Date(lot.dlc).toLocaleDateString('fr-FR') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action rapide */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={fetchAlertes}
                            className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors flex items-center gap-1"
                        >
                            ðŸ”„ Actualiser
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}




