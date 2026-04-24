import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { useAlertes } from '../hooks/useAlertes';
import AjustementStockModal from '../components/AjustementStockModal';
import { 
  Search, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, 
  History, Package, Filter, ArrowRight, Info, Edit3
} from 'lucide-react';

const StocksPage = () => {
    const { tenantId } = useAuth();
    const { depotActif } = useDepot();
    const depotId = depotActif?.id;
    const queryClient = useQueryClient();
    const [recherche, setRecherche] = useState('');
    const [onglet, setOnglet] = useState('stocks');
    const [modalAjustement, setModalAjustement] = useState({ isOpen: false, article: null });

    const { alertes } = useAlertes(tenantId, depotId);

    // 1. Liste des stocks
    const { data: stocks = [], isLoading: loadingStocks } = useQuery({
        queryKey: ['stocks', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/stocks', { params: { tenantId, depotId } });
            return res.data;
        },
        enabled: !!tenantId,
    });

    // 2. Stats
    const { data: statsStocks = {} } = useQuery({
        queryKey: ['stocks-stats', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/stocks/stats', { params: { tenantId, depotId } });
            return res.data;
        },
        enabled: !!tenantId,
    });

    // 3. Mouvements (Audit)
    const { data: mouvements = [], isLoading: loadingMvts } = useQuery({
        queryKey: ['stocks-mouvements', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/stocks/mouvements', { params: { tenantId, depotId } });
            return res.data;
        },
        enabled: !!tenantId && onglet === 'mouvements',
    });

    // 4. Mutation Ajustement
    const mutationAjuster = useMutation({
        mutationFn: async (payload) => {
            return api.post('/stocks/ajuster', { ...payload, tenantId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['stocks']);
            queryClient.invalidateQueries(['stocks-stats']);
            queryClient.invalidateQueries(['stocks-mouvements']);
            setModalAjustement({ isOpen: false, article: null });
        }
    });

    const stocksFiltres = useMemo(() => {
        return stocks.filter(s =>
            s.article?.designation?.toLowerCase().includes(recherche.toLowerCase())
        ).sort((a, b) => {
            const seuilA = a.seuilCritique ?? a.article?.seuilCritique ?? 0;
            const seuilB = b.seuilCritique ?? b.article?.seuilCritique ?? 0;
            const critA = a.quantite <= seuilA;
            const critB = b.quantite <= seuilB;
            if (critA && !critB) return -1;
            if (!critA && critB) return 1;
            return (a.article?.designation || '').localeCompare(b.article?.designation || '');
        });
    }, [stocks, recherche]);

    return (
        <div className="p-6 pb-24 space-y-8 bg-slate-900 min-h-screen text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gestion des Stocks</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Dépôt : <span className="text-indigo-400 font-bold">{depotActif?.nom || 'Global'}</span>
                    </p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
                    <button onClick={() => setOnglet('stocks')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${onglet === 'stocks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>Stocks</button>
                    <button onClick={() => setOnglet('mouvements')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${onglet === 'mouvements' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}>Audit</button>
                </div>
            </div>

            {/* Quick Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                    { label: 'Articles', val: statsStocks.totalArticles, icon: Package, color: 'indigo' },
                    { label: 'En Rupture', val: statsStocks.enRupture, icon: AlertTriangle, color: 'red' },
                    { label: 'Sous le Seuil', val: statsStocks.critiques, icon: TrendingDown, color: 'orange' },
                    { label: 'Valeur Totale', val: `${(statsStocks.valeurStock || 0).toLocaleString()} XAF`, icon: TrendingUp, color: 'emerald' },
                 ].map((stat, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                            <stat.icon size={16} className={`text-${stat.color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-white">{stat.val}</p>
                    </div>
                 ))}
            </div>

            {onglet === 'stocks' && (
                <div className="space-y-6">
                    {/* Filtres */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                value={recherche} onChange={e => setRecherche(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                placeholder="Rechercher un article..."
                            />
                        </div>
                    </div>

                    {/* Table des Stocks */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    <th className="px-6 py-5">Article</th>
                                    <th className="px-6 py-5">Quantité Actuelle</th>
                                    <th className="px-6 py-5">Seuil Critique</th>
                                    <th className="px-6 py-5">Statut</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm">
                                {stocksFiltres.map(s => {
                                    const seuil = s.seuilCritique ?? s.article?.seuilCritique ?? 0;
                                    const isCritique = s.quantite <= seuil;
                                    const isRupture = s.quantite <= 0;

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">{s.article?.designation}</div>
                                                <div className="text-[10px] text-slate-500">ID: {s.articleId.slice(0,8)}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`text-lg font-black ${isRupture ? 'text-red-500' : isCritique ? 'text-orange-500' : 'text-white'}`}>
                                                    {s.quantite} <span className="text-[10px] font-normal text-slate-500">Unités</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-slate-400 font-medium">{seuil}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {isRupture ? (
                                                    <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-1 rounded-md">RUPTURE</span>
                                                ) : isCritique ? (
                                                    <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-2 py-1 rounded-md">CRITIQUE</span>
                                                ) : (
                                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-md">OPTIMAL</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => setModalAjustement({ isOpen: true, article: s })}
                                                    className="bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    <Edit3 size={14} /> Ajuster
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {onglet === 'mouvements' && (
                <div className="space-y-6">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-3">
                         <Info className="text-indigo-400" size={20} />
                         <p className="text-xs text-indigo-300">
                             L'historique d'audit affiche les 200 derniers mouvements pour le dépôt <span className="font-bold underline">{depotActif?.nom || 'Global'}</span>.
                         </p>
                    </div>

                    <div className="space-y-4">
                        {loadingMvts ? (
                            <div className="animate-pulse space-y-4">
                                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-800 rounded-3xl" />)}
                            </div>
                        ) : mouvements.map(mv => (
                            <div key={mv.id} className="bg-slate-800 border border-slate-700 p-5 rounded-3xl flex items-center justify-between hover:border-indigo-500/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${
                                        ['ENTREE_STOCK', 'RECEPTION_FOURNISSEUR', 'TRANSFERT_ENTREE'].includes(mv.type) 
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm uppercase tracking-tight">{mv.article?.designation || 'Article inconnu'}</div>
                                        <div className="text-slate-500 text-[10px] mt-1">
                                            {new Date(mv.createdAt).toLocaleString('fr-FR')} • {mv.type.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`text-lg font-black ${
                                        ['ENTREE_STOCK', 'RECEPTION_FOURNISSEUR', 'TRANSFERT_ENTREE'].includes(mv.type) 
                                        ? 'text-emerald-500' 
                                        : 'text-red-500'
                                    }`}>
                                        {['ENTREE_STOCK', 'RECEPTION_FOURNISSEUR', 'TRANSFERT_ENTREE'].includes(mv.type) ? '+' : '-'}{mv.quantite}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-[200px] italic">
                                        "{mv.motif || 'Aucun motif'}"
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AjustementStockModal 
                isOpen={modalAjustement.isOpen}
                onClose={() => setModalAjustement({ isOpen: false, article: null })}
                article={modalAjustement.article}
                onSubmit={(data) => mutationAjuster.mutate(data)}
            />
        </div>
    );
};

export default StocksPage;




