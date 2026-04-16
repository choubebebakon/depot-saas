import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

// ── Badge type mouvement ────────────────────────────────────
function BadgeType({ type }) {
    const config = {
        ENTREE: { label: '↑ Entrée', classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        SORTIE_VENTE: { label: '↓ Vente', classes: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
        SORTIE: { label: '↓ Sortie', classes: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
        TRANSFERT_SORTIE: { label: '→ Transfert', classes: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
        TRANSFERT_ENTREE: { label: '← Retour', classes: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
        AJUSTEMENT_INVENTAIRE: { label: '⚖ Inventaire', classes: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
        RETOUR_CLIENT: { label: '↩ Retour client', classes: 'bg-slate-600 border-slate-500 text-slate-300' },
        CASSE_AVARIE: { label: '✕ Casse', classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
        SORTIE_GRATUITE: { label: '🎁 Gratuit', classes: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
    };
    const c = config[type] || { label: type, classes: 'bg-slate-700 border-slate-600 text-slate-400' };
    return <span className={`text-xs font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${c.classes}`}>{c.label}</span>;
}

// ── Modal Ajustement Inventaire ─────────────────────────────
function ModalAjustement({ stock, tenantId, onSuccess, onClose }) {
    const [nouvelleQuantite, setNouvelleQuantite] = useState(stock.quantite);
    const [motif, setMotif] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const difference = Number(nouvelleQuantite) - stock.quantite;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!motif.trim()) { setErreur('Motif obligatoire'); return; }
        setLoading(true);
        setErreur('');
        try {
            await api.post('/stocks/ajuster', {
                articleId: stock.articleId,
                siteId: stock.siteId,
                nouvelleQuantite: Number(nouvelleQuantite),
                motif,
                tenantId,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur ajustement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">⚖️ Ajustement Inventaire</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Article : <strong className="text-white">{stock.article?.designation}</strong><br />
                    Stock actuel : <strong className="text-indigo-400">{stock.quantite} unités</strong>
                </p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Nouvelle quantité *
                        </label>
                        <input type="number" min="0" required
                            value={nouvelleQuantite}
                            onChange={e => setNouvelleQuantite(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-2xl font-black text-center focus:outline-none focus:border-indigo-500" />
                    </div>

                    {difference !== 0 && (
                        <div className={`rounded-xl p-3 text-center text-sm font-bold border ${difference > 0
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            {difference > 0 ? '▲' : '▼'} Ajustement de {difference > 0 ? '+' : ''}{difference} unités
                        </div>
                    )}

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Motif * (obligatoire pour audit)
                        </label>
                        <input required value={motif} onChange={e => setMotif(e.target.value)}
                            placeholder="Ex: Comptage physique, Casse non déclarée..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading || difference === 0}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : '⚖️ Ajuster'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page Principale Stocks ──────────────────────────────────
export default function StocksPage() {
    const { tenantId } = useAuth();
    const { siteId, siteActif } = useSite();
    const [stocks, setStocks] = useState([]);
    const [mouvements, setMouvements] = useState([]);
    const [alertes, setAlertes] = useState([]);
    const [statsStocks, setStatsStocks] = useState({ totalArticles: 0, enRupture: 0, critiques: 0, valeurStock: 0 });
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('stocks');
    const [stockAjustement, setStockAjustement] = useState(null);
    const [recherche, setRecherche] = useState('');
    const [filtresMvt, setFiltresMvt] = useState({ startDate: '', endDate: '', articleId: '' });

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const params = { tenantId, ...(siteId ? { siteId } : {}) };
            const [resS, resM, resA, resSt] = await Promise.all([
                api.get('/stocks', { params }),
                api.get('/stocks/mouvements', {
                    params: {
                        ...params,
                        ...(filtresMvt.startDate ? { startDate: filtresMvt.startDate } : {}),
                        ...(filtresMvt.endDate ? { endDate: filtresMvt.endDate } : {}),
                        ...(filtresMvt.articleId ? { articleId: filtresMvt.articleId } : {}),
                    }
                }),
                api.get('/stocks/alertes', { params }),
                api.get('/stocks/stats', { params }),
            ]);
            setStocks(Array.isArray(resS.data) ? resS.data : []);
            setMouvements(Array.isArray(resM.data) ? resM.data : []);
            setAlertes(Array.isArray(resA.data) ? resA.data : []);
            setStatsStocks(resSt.data || {});
        } catch (err) {
            console.error('Erreur stocks:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, siteId, filtresMvt]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        const handler = () => fetchData();
        window.addEventListener('refresh-stocks', handler);
        return () => window.removeEventListener('refresh-stocks', handler);
    }, [fetchData]);

    const stocksFiltres = stocks.filter(s =>
        s.article?.designation?.toLowerCase().includes(recherche.toLowerCase())
    );

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Gestion des Stocks</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Inventaires, mouvements et alertes — {siteActif?.nom || 'Tous les sites'}
                    </p>
                </div>
            </div>

            {/* Alertes critiques */}
            {alertes.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                    <p className="text-red-400 font-black text-sm mb-3">
                        ⚠️ {alertes.length} article(s) en stock critique
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {alertes.map(a => (
                            <span key={a.id} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg">
                                {a.article?.designation} — {a.quantite} u. (seuil: {a.article?.seuilCritique})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats stocks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Articles</p>
                    <p className="text-white text-2xl font-black">{statsStocks.totalArticles}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Ruptures</p>
                    <p className="text-white text-2xl font-black">{statsStocks.enRupture}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Critiques</p>
                    <p className="text-white text-2xl font-black">{statsStocks.critiques}</p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Valeur Stock</p>
                    <p className="text-white text-2xl font-black">{(statsStocks.valeurStock || 0).toLocaleString('fr-FR')}</p>
                    <p className="text-slate-500 text-xs">FCFA</p>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    ['stocks', '📦 Stocks'],
                    ['mouvements', '📋 Mouvements'],
                ].map(([id, label]) => (
                    <button key={id} onClick={() => setOnglet(id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${onglet === id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Onglet Stocks ── */}
            {onglet === 'stocks' && (
                <>
                    <input value={recherche} onChange={e => setRecherche(e.target.value)}
                        placeholder="🔍 Rechercher un article..."
                        className="w-full mb-4 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                        <th className="px-6 py-4">Article</th>
                                        <th className="px-6 py-4">Site</th>
                                        <th className="px-6 py-4 text-center">Quantité</th>
                                        <th className="px-6 py-4 text-center">Seuil critique</th>
                                        <th className="px-6 py-4 text-right">Valeur stock</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {stocksFiltres.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">Aucun stock trouvé</td></tr>
                                    ) : stocksFiltres.map(s => {
                                        const isRupture = s.quantite <= 0;
                                        const isCritique = s.quantite > 0 && s.quantite <= s.article?.seuilCritique;
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-white font-bold text-sm">{s.article?.designation}</p>
                                                    <p className="text-slate-500 text-xs">{s.article?.prixVente?.toLocaleString('fr-FR')} FCFA/u</p>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-sm">{s.site?.nom}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-black border ${isRupture ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                            : isCritique ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        }`}>
                                                        {isRupture ? 'RUPTURE' : `${s.quantite} u.`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-400 text-sm">
                                                    {s.article?.seuilCritique || 0}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-300 font-bold text-sm">
                                                    {(s.quantite * (s.article?.prixAchat || 0)).toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setStockAjustement(s)}
                                                        className="bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 text-yellow-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                                        ⚖️ Ajuster
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* ── Onglet Mouvements ── */}
            {onglet === 'mouvements' && (
                <>
                    {/* Filtres mouvements */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-slate-500 text-xs mb-1 block">Date début</label>
                                <input type="date" value={filtresMvt.startDate}
                                    onChange={e => setFiltresMvt({ ...filtresMvt, startDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs mb-1 block">Date fin</label>
                                <input type="date" value={filtresMvt.endDate}
                                    onChange={e => setFiltresMvt({ ...filtresMvt, endDate: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs mb-1 block">Article</label>
                                <select value={filtresMvt.articleId}
                                    onChange={e => setFiltresMvt({ ...filtresMvt, articleId: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                    <option value="">Tous les articles</option>
                                    {stocks.map(s => (
                                        <option key={s.articleId} value={s.articleId}>{s.article?.designation}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : mouvements.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                <p className="text-4xl mb-3">📋</p>
                                <p>Aucun mouvement trouvé</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Article</th>
                                        <th className="px-6 py-4">Site</th>
                                        <th className="px-6 py-4 text-center">Quantité</th>
                                        <th className="px-6 py-4">Motif</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {mouvements.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4"><BadgeType type={m.type} /></td>
                                            <td className="px-6 py-4 text-white font-semibold text-sm">{m.article?.designation}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{m.site?.nom}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-black text-sm ${['ENTREE', 'TRANSFERT_ENTREE'].includes(m.type) ? 'text-emerald-400'
                                                        : 'text-red-400'
                                                    }`}>
                                                    {['ENTREE', 'TRANSFERT_ENTREE'].includes(m.type) ? '+' : '-'}{m.quantite}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px] truncate">{m.motif || '—'}</td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {new Date(m.createdAt).toLocaleDateString('fr-FR')}{' '}
                                                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Modal ajustement */}
            {stockAjustement && (
                <ModalAjustement
                    stock={stockAjustement}
                    tenantId={tenantId}
                    onSuccess={() => { fetchData(); window.dispatchEvent(new CustomEvent('refresh-stocks')); }}
                    onClose={() => setStockAjustement(null)}
                />
            )}
        </div>
    );
}