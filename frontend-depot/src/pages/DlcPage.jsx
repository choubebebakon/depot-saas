import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

// â”€â”€ Badge statut DLC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BadgeDLC({ statut, jours }) {
    const config = {
        OK: { label: 'âœ“ OK', classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        ATTENTION: { label: 'âš ï¸ Attention', classes: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
        URGENT: { label: 'ðŸ”¥ Urgent', classes: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
        EXPIRE: { label: 'â˜ ï¸ Expiré', classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
    };
    const c = config[statut] || config.OK;
    return (
        <div className="flex flex-col items-start gap-1">
            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${c.classes}`}>
                {c.label}
            </span>
            {jours !== null && (
                <span className="text-slate-500 text-xs">
                    {jours < 0 ? `Expiré depuis ${Math.abs(jours)}j` : `${jours}j restants`}
                </span>
            )}
        </div>
    );
}

// â”€â”€ Modal Nouveau Lot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalNouveauLot({ tenantId, depotId, articles, onSuccess, onClose }) {
    const [form, setForm] = useState({
        articleId: '',
        quantite: '',
        dlc: '',
        numeroLot: '',
    });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!depotId) { setErreur('Sélectionnez un Dépôt dans le menu.'); return; }
        setLoading(true);
        setErreur('');
        try {
            await api.post('/dlc/lots', {
                ...form,
                quantite: Number(form.quantite),
                tenantId,
                depotId,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur création lot');
        } finally {
            setLoading(false);
        }
    };

    // Date min = aujourd'hui
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">ðŸ“¦ Nouveau Lot</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Enregistre un lot avec sa date de péremption (DLC)
                </p>
                {erreur && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                        {erreur}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Article *
                        </label>
                        <select required value={form.articleId}
                            onChange={e => setForm({ ...form, articleId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Choisir un article...</option>
                            {articles.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.famille?.emoji} {a.designation} {a.format && `(${a.format})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                Quantité (bouteilles) *
                            </label>
                            <input type="number" min="1" required
                                value={form.quantite}
                                onChange={e => setForm({ ...form, quantite: e.target.value })}
                                placeholder="Ex: 120"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                NÂ° de Lot (optionnel)
                            </label>
                            <input value={form.numeroLot}
                                onChange={e => setForm({ ...form, numeroLot: e.target.value })}
                                placeholder="Ex: L2026-042"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Date Limite de Consommation (DLC)
                        </label>
                        <input type="date" min={today}
                            value={form.dlc}
                            onChange={e => setForm({ ...form, dlc: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                        <p className="text-slate-600 text-xs mt-1">
                            Laisser vide si le produit n'a pas de DLC (ex: bières en bouteille verre)
                        </p>
                    </div>

                    {/* Alerte si DLC proche */}
                    {form.dlc && (() => {
                        const jours = Math.floor((new Date(form.dlc) - new Date()) / (1000 * 60 * 60 * 24));
                        if (jours < 30) return (
                            <div className={`p-3 rounded-xl text-sm font-bold border ${jours < 0 ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : jours < 7 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                }`}>
                                âš ï¸ Attention : {jours < 0 ? 'Date déjÃ  dépassée !' : `Seulement ${jours} jours avant expiration`}
                            </div>
                        );
                        return null;
                    })()}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : 'ðŸ“¦ Créer le Lot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Modifier DLC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalModifierDLC({ lot, tenantId, onSuccess, onClose }) {
    const [dlc, setDlc] = useState(
        lot.dlc ? new Date(lot.dlc).toISOString().split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/dlc/lots/${lot.id}`, { dlc }, { params: { tenantId } });
            onSuccess();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">âœï¸ Modifier la DLC</h3>
                <p className="text-slate-400 text-sm mb-4">
                    Lot : <strong className="text-white">
                        {lot.article?.designation} {lot.article?.format}
                    </strong>
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="date" value={dlc} onChange={e => setDlc(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'Modifier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Page Principale DLC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DlcPage() {
    const { tenantId } = useAuth();
    const { depotId, DépôtActif } = useDepot();
    const [lots, setLots] = useState([]);
    const [articles, setArticles] = useState([]);
    const [stats, setStats] = useState({ total: 0, ok: 0, attention: 0, urgent: 0, expire: 0 });
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('alertes');
    const [modalNouvel, setModalNouvel] = useState(false);
    const [lotEdit, setLotEdit] = useState(null);
    const [filtreFamille, setFiltreFamille] = useState('');

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const params = { tenantId, ...(depotId ? { depotId } : {}) };
            const [resLots, resArticles, resStats] = await Promise.all([
                api.get('/dlc/lots', { params }),
                api.get('/catalogue/articles', { params: { tenantId } }),
                api.get('/dlc/stats', { params }),
            ]);
            setLots(Array.isArray(resLots.data) ? resLots.data : []);
            setArticles(Array.isArray(resArticles.data) ? resArticles.data : []);
            setStats(resStats.data || {});
        } catch (err) {
            console.error('Erreur DLC:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, depotId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filtrage selon onglet
    const lotsFiltres = lots.filter(l => {
        const matchOnglet =
            onglet === 'alertes'
                ? ['URGENT', 'EXPIRE', 'ATTENTION'].includes(l.statutDLC)
                : onglet === 'expire'
                    ? l.statutDLC === 'EXPIRE'
                    : true;
        const matchFamille = !filtreFamille || l.article?.familleId === filtreFamille;
        return matchOnglet && matchFamille;
    });

    // Familles uniques des lots
    const familles = [...new Map(
        lots.map(l => [l.article?.familleId, l.article?.famille])
    ).entries()]
        .filter(([k, v]) => k && v)
        .map(([k, v]) => ({ id: k, ...v }));

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Gestion DLC & Lots</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Dates de péremption â€” FIFO automatique â€” {DépôtActif?.nom || 'Tous depots'}
                    </p>
                </div>
                <button onClick={() => setModalNouvel(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
                    ðŸ“¦ Nouveau Lot
                </button>
            </div>

            {/* Cartes stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Lots', val: stats.total, color: 'slate' },
                    { label: 'âœ“ OK', val: stats.ok, color: 'emerald' },
                    { label: 'âš ï¸ Attention', val: stats.attention, color: 'yellow' },
                    { label: 'ðŸ”¥ Urgent', val: stats.urgent, color: 'orange' },
                    { label: 'â˜ ï¸ Expirés', val: stats.expire, color: 'red' },
                ].map((c, i) => (
                    <div key={i} className={`bg-${c.color}-500/10 border border-${c.color}-500/20 rounded-2xl p-4`}>
                        <p className={`text-${c.color}-400 text-xs font-bold uppercase tracking-widest mb-2`}>
                            {c.label}
                        </p>
                        <p className="text-white text-2xl font-black">{c.val ?? 0}</p>
                    </div>
                ))}
            </div>

            {/* Alerte rouge si expirés */}
            {stats.expire > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <span className="text-2xl">â˜ ï¸</span>
                    <div>
                        <p className="text-red-400 font-black">
                            {stats.expire} lot(s) EXPIRÉ(S) â€” Retirer immédiatement du stock !
                        </p>
                        <p className="text-red-400/70 text-xs mt-1">
                            Ces produits ne doivent plus être vendus.
                        </p>
                    </div>
                </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    ['alertes', `ðŸš¨ Alertes (${(stats.attention || 0) + (stats.urgent || 0) + (stats.expire || 0)})`],
                    ['tous', `ðŸ“¦ Tous les lots (${stats.total || 0})`],
                    ['expire', `â˜ ï¸ Expirés (${stats.expire || 0})`],
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

            {/* Filtre famille */}
            {familles.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                    <button onClick={() => setFiltreFamille('')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${!filtreFamille ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                        Toutes familles
                    </button>
                    {familles.map(f => (
                        <button key={f.id} onClick={() => setFiltreFamille(f.id)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filtreFamille === f.id ? 'bg-slate-600 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}>
                            {f.emoji} {f.nom}
                        </button>
                    ))}
                </div>
            )}

            {/* Tableau lots */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : lotsFiltres.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <p className="text-4xl mb-3">ðŸ“¦</p>
                        <p className="font-semibold">
                            {onglet === 'alertes' ? 'âœ… Aucune alerte DLC â€” Tout est frais !' : 'Aucun lot trouvé'}
                        </p>
                        <button onClick={() => setModalNouvel(true)}
                            className="mt-4 text-indigo-400 text-sm font-bold">
                            + Créer un premier lot
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                <th className="px-6 py-4">Article</th>
                                <th className="px-6 py-4">Dépôt</th>
                                <th className="px-6 py-4 text-center">Qté restante</th>
                                <th className="px-6 py-4">DLC</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4">NÂ° Lot</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {lotsFiltres.map(lot => (
                                <tr key={lot.id}
                                    className={`transition-colors ${lot.statutDLC === 'EXPIRE' ? 'bg-red-500/5 hover:bg-red-500/10'
                                            : lot.statutDLC === 'URGENT' ? 'bg-orange-500/5 hover:bg-orange-500/10'
                                                : 'hover:bg-slate-700/30'
                                        }`}>

                                    {/* Article */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {lot.article?.famille?.emoji || 'ðŸ“¦'}
                                            </span>
                                            <div>
                                                <p className="text-white font-bold text-sm">
                                                    {lot.article?.designation}
                                                </p>
                                                <p className="text-slate-500 text-xs">
                                                    {lot.article?.format} â€” {lot.article?.marque?.nom}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Dépôt */}
                                    <td className="px-6 py-4 text-slate-400 text-sm">{lot.Dépôt?.nom}</td>

                                    {/* Quantité */}
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-white font-black">{lot.quantite}</span>
                                        <span className="text-slate-500 text-xs ml-1">
                                            / {lot.quantiteInitiale} btl.
                                        </span>
                                        {/* Barre de progression */}
                                        <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                                            <div
                                                className={`h-1 rounded-full ${lot.statutDLC === 'EXPIRE' ? 'bg-red-500'
                                                        : lot.statutDLC === 'URGENT' ? 'bg-orange-500'
                                                            : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${(lot.quantite / lot.quantiteInitiale) * 100}%` }}
                                            />
                                        </div>
                                    </td>

                                    {/* DLC */}
                                    <td className="px-6 py-4">
                                        {lot.dlc ? (
                                            <span className={`font-bold text-sm ${lot.statutDLC === 'EXPIRE' ? 'text-red-400'
                                                    : lot.statutDLC === 'URGENT' ? 'text-orange-400'
                                                        : lot.statutDLC === 'ATTENTION' ? 'text-yellow-400'
                                                            : 'text-slate-300'
                                                }`}>
                                                {new Date(lot.dlc).toLocaleDateString('fr-FR')}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-sm">Sans DLC</span>
                                        )}
                                    </td>

                                    {/* Statut */}
                                    <td className="px-6 py-4">
                                        <BadgeDLC statut={lot.statutDLC} jours={lot.joursRestants} />
                                    </td>

                                    {/* NÂ° Lot */}
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {lot.numeroLot || 'â€”'}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setLotEdit(lot)}
                                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                            âœï¸ DLC
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info FIFO */}
            <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-400">
                <strong>ðŸ“‹ FIFO Automatique :</strong> Lors des ventes, le système déduit automatiquement
                les lots dont la DLC est la plus proche en premier pour minimiser les pertes.
            </div>

            {/* Modals */}
            {modalNouvel && (
                <ModalNouveauLot
                    tenantId={tenantId} depotId={depotId} articles={articles}
                    onSuccess={fetchData} onClose={() => setModalNouvel(false)}
                />
            )}
            {lotEdit && (
                <ModalModifierDLC
                    lot={lotEdit} tenantId={tenantId}
                    onSuccess={fetchData} onClose={() => setLotEdit(null)}
                />
            )}
        </div>
    );
}




