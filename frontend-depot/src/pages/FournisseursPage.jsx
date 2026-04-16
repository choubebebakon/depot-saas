import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';

// ── Modal Nouveau Fournisseur ───────────────────────────────
function ModalNouveauFournisseur({ tenantId, onSuccess, onClose }) {
    const [form, setForm] = useState({ nom: '', telephone: '' });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/fournisseurs', { ...form, tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">🏭 Nouveau Fournisseur</h3>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
                        <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                            placeholder="Brasseries du Cameroun"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
                        <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                            placeholder="+237 6XX XXX XXX"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Réception Camion ──────────────────────────────────
function ModalReception({ tenantId, siteId, fournisseurs, articles, onSuccess, onClose }) {
    const [fournisseurId, setFournisseurId] = useState('');
    const [modePaiement, setModePaiement] = useState('CASH');
    const [montantPaye, setMontantPaye] = useState(0);
    const [lignes, setLignes] = useState([{ articleId: '', quantiteLivree: 0, quantiteGratuite: 0, prixAchatUnitaire: 0 }]);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const updateLigne = (i, champ, val) => {
        const copy = [...lignes];
        copy[i][champ] = val;
        setLignes(copy);
    };

    const totalReception = lignes.reduce((acc, l) => acc + (l.prixAchatUnitaire * l.quantiteLivree), 0);
    const montantDette = Math.max(0, totalReception - montantPaye);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!siteId) { setErreur('Sélectionnez un site dans le menu.'); return; }
        setLoading(true);
        setErreur('');
        try {
            await api.post('/fournisseurs/receptions', {
                fournisseurId, siteId, tenantId, modePaiement,
                montantPaye: Number(montantPaye),
                lignes: lignes.map(l => ({
                    articleId: l.articleId,
                    quantiteLivree: Number(l.quantiteLivree),
                    quantiteGratuite: Number(l.quantiteGratuite),
                    prixAchatUnitaire: Number(l.prixAchatUnitaire),
                })),
            });
            window.dispatchEvent(new CustomEvent('refresh-stocks'));
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur réception');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-2xl shadow-2xl my-4">
                <h3 className="text-white font-black text-xl mb-6">🚛 Réception Fournisseur</h3>

                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Fournisseur */}
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label>
                        <select required value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Sélectionner...</option>
                            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                    </div>

                    {/* Lignes articles */}
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Articles reçus</label>
                        <div className="space-y-3">
                            {lignes.map((ligne, i) => (
                                <div key={i} className="bg-slate-800 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-xs font-bold">Article {i + 1}</span>
                                        {lignes.length > 1 && (
                                            <button type="button" onClick={() => setLignes(lignes.filter((_, idx) => idx !== i))}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold">✕ Retirer</button>
                                        )}
                                    </div>
                                    <select required value={ligne.articleId} onChange={e => updateLigne(i, 'articleId', e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                                        <option value="">Choisir un article...</option>
                                        {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                                    </select>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-slate-500 text-xs mb-1 block">Qté livrée *</label>
                                            <input type="number" min="0" required value={ligne.quantiteLivree}
                                                onChange={e => updateLigne(i, 'quantiteLivree', e.target.value)}
                                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs mb-1 block">Qté gratuite 🎁</label>
                                            <input type="number" min="0" value={ligne.quantiteGratuite}
                                                onChange={e => updateLigne(i, 'quantiteGratuite', e.target.value)}
                                                className="w-full bg-slate-700 border border-slate-600 text-emerald-400 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-emerald-500" />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs mb-1 block">Prix achat/u *</label>
                                            <input type="number" min="0" required value={ligne.prixAchatUnitaire}
                                                onChange={e => updateLigne(i, 'prixAchatUnitaire', e.target.value)}
                                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button"
                            onClick={() => setLignes([...lignes, { articleId: '', quantiteLivree: 0, quantiteGratuite: 0, prixAchatUnitaire: 0 }])}
                            className="w-full mt-3 border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-2 text-sm font-semibold transition-all">
                            + Ajouter un article
                        </button>
                    </div>

                    {/* Paiement */}
                    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Paiement fournisseur</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CREDIT'].map(m => (
                                <button key={m} type="button" onClick={() => setModePaiement(m)}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${modePaiement === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'
                                        }`}>
                                    {m === 'CASH' ? 'Cash' : m === 'ORANGE_MONEY' ? 'Orange Money' : m === 'MTN_MOMO' ? 'MTN MoMo' : 'Dette'}
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs mb-1 block">Montant payé maintenant (FCFA)</label>
                            <input type="number" min="0" value={montantPaye}
                                onChange={e => setMontantPaye(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>

                        {/* Récapitulatif */}
                        <div className="border-t border-slate-700 pt-3 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total réception</span>
                                <span className="text-white font-bold">{totalReception.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Payé maintenant</span>
                                <span className="text-emerald-400 font-bold">{Number(montantPaye).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            {montantDette > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-400">Dette générée</span>
                                    <span className="text-red-400 font-bold">{montantDette.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? 'Validation...' : '✅ Valider la Réception'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page Principale ─────────────────────────────────────────
export default function FournisseursPage() {
    const { tenantId } = useAuth();
    const { siteId } = useSite();
    const [fournisseurs, setFournisseurs] = useState([]);
    const [receptions, setReceptions] = useState([]);
    const [articles, setArticles] = useState([]);
    const [stats, setStats] = useState({ totalDette: 0, nbFournisseursEnDette: 0, totalReceptions: 0 });
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('fournisseurs');
    const [modalNouvel, setModalNouvel] = useState(false);
    const [modalReception, setModalReception] = useState(false);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resF, resR, resA, resS] = await Promise.all([
                api.get('/fournisseurs', { params: { tenantId } }),
                api.get('/fournisseurs/receptions', { params: { tenantId, siteId } }),
                api.get('/articles', { params: { tenantId } }),
                api.get('/fournisseurs/stats', { params: { tenantId } }),
            ]);
            setFournisseurs(Array.isArray(resF.data) ? resF.data : []);
            setReceptions(Array.isArray(resR.data) ? resR.data : []);
            setArticles(Array.isArray(resA.data) ? resA.data : []);
            setStats(resS.data);
        } catch (err) {
            console.error('Erreur fournisseurs:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, siteId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Fournisseurs & Réceptions</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestion des livraisons et dettes fournisseurs</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setModalNouvel(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        + Fournisseur
                    </button>
                    <button onClick={() => setModalReception(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                        🚛 Réceptionner
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Fournisseurs</p>
                    <p className="text-white text-3xl font-black">{fournisseurs.length}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Dettes Totales</p>
                    <p className="text-white text-3xl font-black">{stats.totalDette.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Réceptions</p>
                    <p className="text-white text-3xl font-black">{stats.totalReceptions}</p>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                {[['fournisseurs', '🏭 Fournisseurs'], ['receptions', '📦 Réceptions']].map(([id, label]) => (
                    <button key={id} onClick={() => setOnglet(id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${onglet === id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Liste fournisseurs */}
            {onglet === 'fournisseurs' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : fournisseurs.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">🏭</p>
                            <p className="font-semibold">Aucun fournisseur</p>
                            <button onClick={() => setModalNouvel(true)}
                                className="mt-4 text-indigo-400 text-sm font-bold">+ Ajouter un fournisseur</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Fournisseur</th>
                                    <th className="px-6 py-4">Téléphone</th>
                                    <th className="px-6 py-4">Réceptions</th>
                                    <th className="px-6 py-4">Dette</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {fournisseurs.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-400 font-black text-sm">
                                                    {f.nom[0].toUpperCase()}
                                                </div>
                                                <p className="text-white font-bold text-sm">{f.nom}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{f.telephone || '—'}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{f._count?.receptions || 0}</td>
                                        <td className="px-6 py-4">
                                            {f.solde > 0
                                                ? <span className="text-red-400 font-bold text-sm">{f.solde.toLocaleString('fr-FR')} FCFA</span>
                                                : <span className="text-emerald-400 text-sm font-bold">✓ Soldé</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Liste réceptions */}
            {onglet === 'receptions' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {receptions.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">📦</p>
                            <p className="font-semibold">Aucune réception enregistrée</p>
                            <button onClick={() => setModalReception(true)}
                                className="mt-4 text-indigo-400 text-sm font-bold">🚛 Première réception</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Référence</th>
                                    <th className="px-6 py-4">Fournisseur</th>
                                    <th className="px-6 py-4">Site</th>
                                    <th className="px-6 py-4">Payé</th>
                                    <th className="px-6 py-4">Dette</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {receptions.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-indigo-400 font-bold text-sm">{r.reference}</td>
                                        <td className="px-6 py-4 text-white font-semibold text-sm">{r.fournisseur?.nom}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{r.site?.nom}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-bold text-sm">{r.montantPaye.toLocaleString('fr-FR')} FCFA</td>
                                        <td className="px-6 py-4">
                                            {r.montantDette > 0
                                                ? <span className="text-red-400 font-bold text-sm">{r.montantDette.toLocaleString('fr-FR')} FCFA</span>
                                                : <span className="text-emerald-400 text-sm">✓</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modals */}
            {modalNouvel && (
                <ModalNouveauFournisseur tenantId={tenantId} onSuccess={fetchData} onClose={() => setModalNouvel(false)} />
            )}
            {modalReception && (
                <ModalReception
                    tenantId={tenantId} siteId={siteId}
                    fournisseurs={fournisseurs} articles={articles}
                    onSuccess={fetchData} onClose={() => setModalReception(false)}
                />
            )}
        </div>
    );
}