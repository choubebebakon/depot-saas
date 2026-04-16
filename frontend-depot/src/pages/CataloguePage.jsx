import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Convertisseur d'unités ──────────────────────────────────
function convertirUnites(qte, article) {
    if (!article) return null;
    const { uniteParPalette = 120, uniteParCasier = 12, uniteParPack = 6 } = article;
    const palettes = Math.floor(qte / uniteParPalette);
    const r1 = qte % uniteParPalette;
    const casiers = Math.floor(r1 / uniteParCasier);
    const r2 = r1 % uniteParCasier;
    const packs = Math.floor(r2 / uniteParPack);
    const bouteilles = r2 % uniteParPack;
    return { palettes, casiers, packs, bouteilles };
}

function AffichageStock({ qte, article }) {
    const c = convertirUnites(qte, article);
    if (!c) return <span>{qte} u.</span>;
    const parts = [];
    if (c.palettes > 0) parts.push(`${c.palettes} pal.`);
    if (c.casiers > 0) parts.push(`${c.casiers} cas.`);
    if (c.bouteilles > 0) parts.push(`${c.bouteilles} btl.`);
    return (
        <span className="text-xs">
            {parts.length > 0 ? parts.join(' + ') : '0 btl.'}
            <span className="text-slate-600 ml-1">({qte} u.)</span>
        </span>
    );
}

// ── Modal Nouvelle Famille ──────────────────────────────────
function ModalFamille({ tenantId, onSuccess, onClose }) {
    const [form, setForm] = useState({ nom: '', emoji: '📦' });
    const emojis = ['🍺', '🥤', '💧', '🧃', '🍷', '🥛', '📦'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/catalogue/familles', { ...form, tenantId });
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">📂 Nouvelle Famille</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
                        <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex: Bière, Jus, Eau..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Icône</label>
                        <div className="flex gap-2 flex-wrap">
                            {emojis.map(e => (
                                <button key={e} type="button"
                                    onClick={() => setForm({ ...form, emoji: e })}
                                    className={`text-2xl p-2 rounded-xl border transition-all ${form.emoji === e ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700 hover:border-slate-500'
                                        }`}>
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Nouvelle Marque ───────────────────────────────────
function ModalMarque({ tenantId, familles, onSuccess, onClose }) {
    const [form, setForm] = useState({ nom: '', familleId: familles[0]?.id || '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/catalogue/marques', { ...form, tenantId });
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">🏭 Nouvelle Marque</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Famille *</label>
                        <select required value={form.familleId} onChange={e => setForm({ ...form, familleId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            {familles.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.nom}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom Marque *</label>
                        <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex: SABC, Guinness, Source du Pays..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Nouvel Article ────────────────────────────────────
function ModalArticle({ tenantId, familles, article, onSuccess, onClose }) {
    const estModif = !!article;
    const [form, setForm] = useState({
        designation: article?.designation || '',
        format: article?.format || '',
        prixVente: article?.prixVente || '',
        prixAchat: article?.prixAchat || '',
        seuilCritique: article?.seuilCritique || 0,
        estConsigne: article?.estConsigne || false,
        uniteParCasier: article?.uniteParCasier || 12,
        uniteParPack: article?.uniteParPack || 6,
        uniteParPalette: article?.uniteParPalette || 120,
        familleId: article?.familleId || '',
        marqueId: article?.marqueId || '',
    });
    const [marques, setMarques] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    // Charge les marques de la famille sélectionnée
    useEffect(() => {
        if (!form.familleId) { setMarques([]); return; }
        api.get('/catalogue/marques', { params: { tenantId, familleId: form.familleId } })
            .then(res => setMarques(Array.isArray(res.data) ? res.data : []))
            .catch(() => setMarques([]));
    }, [form.familleId, tenantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            if (estModif) {
                await api.put(`/catalogue/articles/${article.id}`, form, { params: { tenantId } });
            } else {
                await api.post('/catalogue/articles', { ...form, tenantId });
            }
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    // Calcul de la marge
    const marge = form.prixVente && form.prixAchat
        ? (((form.prixVente - form.prixAchat) / form.prixVente) * 100).toFixed(1)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-xl shadow-2xl my-4">
                <h3 className="text-white font-black text-xl mb-6">
                    {estModif ? '✏️ Modifier Article' : '➕ Nouvel Article'}
                </h3>

                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Famille + Marque */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Famille</label>
                            <select value={form.familleId}
                                onChange={e => setForm({ ...form, familleId: e.target.value, marqueId: '' })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                <option value="">Sans famille</option>
                                {familles.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Marque</label>
                            <select value={form.marqueId}
                                onChange={e => setForm({ ...form, marqueId: e.target.value })}
                                disabled={!form.familleId || marques.length === 0}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-40">
                                <option value="">Sans marque</option>
                                {marques.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Désignation + Format */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Désignation *</label>
                            <input required value={form.designation}
                                onChange={e => setForm({ ...form, designation: e.target.value })}
                                placeholder="Ex: Castel Beer"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Format</label>
                            <input value={form.format}
                                onChange={e => setForm({ ...form, format: e.target.value })}
                                placeholder="Ex: 65cl, 1.5L, Pack 6"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* Prix */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix Vente (FCFA) *</label>
                            <input required type="number" min="0" value={form.prixVente}
                                onChange={e => setForm({ ...form, prixVente: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix Achat (FCFA)</label>
                            <input type="number" min="0" value={form.prixAchat}
                                onChange={e => setForm({ ...form, prixAchat: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* Marge calculée */}
                    {marge && (
                        <div className={`rounded-xl p-3 text-center text-sm font-bold border ${marge >= 20 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : marge >= 10 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            Marge : {marge}% — {form.prixVente - form.prixAchat} FCFA/unité
                        </div>
                    )}

                    {/* Conversions */}
                    <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                            📦 Conversions (unité = bouteille)
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'uniteParCasier', label: 'Btl / Casier', icon: '📦' },
                                { key: 'uniteParPack', label: 'Btl / Pack', icon: '🗂️' },
                                { key: 'uniteParPalette', label: 'Btl / Palette', icon: '🏗️' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-slate-500 text-xs mb-1 block">{f.icon} {f.label}</label>
                                    <input type="number" min="1" value={form[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-500" />
                                </div>
                            ))}
                        </div>

                        {/* Aperçu conversion */}
                        <div className="mt-3 p-3 bg-slate-700/50 rounded-lg text-xs text-slate-400">
                            <span className="font-bold text-slate-300">Aperçu :</span>
                            {' '}1 palette = {form.uniteParPalette} btl =
                            {' '}{Math.floor(form.uniteParPalette / form.uniteParCasier)} casiers
                        </div>
                    </div>

                    {/* Seuil + Consigne */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                Seuil Critique (btl)
                            </label>
                            <input type="number" min="0" value={form.seuilCritique}
                                onChange={e => setForm({ ...form, seuilCritique: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => setForm({ ...form, estConsigne: !form.estConsigne })}
                                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${form.estConsigne ? 'bg-indigo-600' : 'bg-slate-700'
                                        }`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.estConsigne ? 'left-7' : 'left-1'
                                        }`} />
                                </div>
                                <span className="text-slate-300 text-sm font-semibold">Avec consigne</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : estModif ? '✏️ Modifier' : '➕ Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page Principale Catalogue ───────────────────────────────
export default function CataloguePage() {
    const { tenantId } = useAuth();
    const [familles, setFamilles] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [familleActive, setFamilleActive] = useState(null);
    const [marqueActive, setMarqueActive] = useState(null);
    const [recherche, setRecherche] = useState('');
    const [modalFamille, setModalFamille] = useState(false);
    const [modalMarque, setModalMarque] = useState(false);
    const [modalArticle, setModalArticle] = useState(false);
    const [articleEdit, setArticleEdit] = useState(null);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resF, resA] = await Promise.all([
                api.get('/catalogue/familles', { params: { tenantId } }),
                api.get('/catalogue/articles', { params: { tenantId } }),
            ]);
            setFamilles(Array.isArray(resF.data) ? resF.data : []);
            setArticles(Array.isArray(resA.data) ? resA.data : []);
        } catch (err) {
            console.error('Erreur catalogue:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filtrage articles
    const articlesFiltres = articles.filter(a => {
        const matchFamille = !familleActive || a.familleId === familleActive;
        const matchMarque = !marqueActive || a.marqueId === marqueActive;
        const matchRecherche = !recherche ||
            a.designation.toLowerCase().includes(recherche.toLowerCase()) ||
            a.format?.toLowerCase().includes(recherche.toLowerCase());
        return matchFamille && matchMarque && matchRecherche;
    });

    // Marques de la famille active
    const marquesFamille = familleActive
        ? familles.find(f => f.id === familleActive)?.marques || []
        : [];

    // Stats
    const totalArticles = articles.length;
    const articlesEnRupture = articles.filter(a =>
        a.stocks?.some(s => s.quantite <= 0)
    ).length;

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Catalogue Produits</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Famille → Marque → Format — Conversions automatiques
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button onClick={() => setModalFamille(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        📂 Famille
                    </button>
                    <button onClick={() => setModalMarque(true)}
                        disabled={familles.length === 0}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        🏭 Marque
                    </button>
                    <button onClick={() => { setArticleEdit(null); setModalArticle(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
                        ➕ Nouvel Article
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Familles</p>
                    <p className="text-white text-2xl font-black">{familles.length}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Marques</p>
                    <p className="text-white text-2xl font-black">
                        {familles.reduce((acc, f) => acc + (f.marques?.length || 0), 0)}
                    </p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Références</p>
                    <p className="text-white text-2xl font-black">{totalArticles}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Ruptures</p>
                    <p className="text-white text-2xl font-black">{articlesEnRupture}</p>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Familles */}
                <div className="w-48 shrink-0 space-y-1">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 px-2">Familles</p>
                    <button
                        onClick={() => { setFamilleActive(null); setMarqueActive(null); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${!familleActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}>
                        📦 Toutes ({totalArticles})
                    </button>
                    {familles.map(f => (
                        <button key={f.id}
                            onClick={() => { setFamilleActive(f.id); setMarqueActive(null); }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${familleActive === f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}>
                            {f.emoji} {f.nom}
                            <span className="float-right opacity-60 text-xs">{f._count?.articles || 0}</span>
                        </button>
                    ))}
                </div>

                {/* Zone principale */}
                <div className="flex-1 min-w-0">
                    {/* Filtre marques si famille sélectionnée */}
                    {familleActive && marquesFamille.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                            <button onClick={() => setMarqueActive(null)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${!marqueActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}>
                                Toutes marques
                            </button>
                            {marquesFamille.map(m => (
                                <button key={m.id} onClick={() => setMarqueActive(m.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${marqueActive === m.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}>
                                    {m.nom} ({m._count?.articles || 0})
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Recherche */}
                    <input value={recherche} onChange={e => setRecherche(e.target.value)}
                        placeholder="🔍 Rechercher un article..."
                        className="w-full mb-4 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />

                    {/* Grille articles */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : articlesFiltres.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <p className="text-4xl mb-3">📦</p>
                            <p className="font-semibold">Aucun article trouvé</p>
                            <button onClick={() => { setArticleEdit(null); setModalArticle(true); }}
                                className="mt-4 text-indigo-400 text-sm font-bold">➕ Créer un article</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {articlesFiltres.map(a => {
                                const stockTotal = a.stocks?.reduce((acc, s) => acc + s.quantite, 0) || 0;
                                const isRupture = stockTotal <= 0;
                                const isCritique = stockTotal > 0 && stockTotal <= a.seuilCritique;
                                const marge = a.prixAchat > 0
                                    ? (((a.prixVente - a.prixAchat) / a.prixVente) * 100).toFixed(0)
                                    : null;

                                return (
                                    <div key={a.id}
                                        className={`bg-slate-800/50 border rounded-2xl p-5 hover:border-indigo-500/50 transition-all group ${isRupture ? 'border-red-500/30' : isCritique ? 'border-orange-500/30' : 'border-slate-700'
                                            }`}>

                                        {/* Header carte */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {a.famille && (
                                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg">
                                                            {a.famille.emoji} {a.famille.nom}
                                                        </span>
                                                    )}
                                                    {a.marque && (
                                                        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                                            {a.marque.nom}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-white font-black text-sm">{a.designation}</p>
                                                {a.format && <p className="text-slate-500 text-xs mt-0.5">{a.format}</p>}
                                            </div>
                                            <button onClick={() => { setArticleEdit(a); setModalArticle(true); }}
                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all p-1 ml-2">
                                                ✏️
                                            </button>
                                        </div>

                                        {/* Prix + marge */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-white font-black">{a.prixVente.toLocaleString('fr-FR')} FCFA</span>
                                            {marge && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${marge >= 20 ? 'bg-emerald-500/10 text-emerald-400'
                                                        : marge >= 10 ? 'bg-yellow-500/10 text-yellow-400'
                                                            : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {marge}% marge
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock converti */}
                                        <div className={`rounded-xl px-3 py-2 text-xs font-bold border ${isRupture ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                : isCritique ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {isRupture ? '⚠️ RUPTURE' : (
                                                <>
                                                    📦 <AffichageStock qte={stockTotal} article={a} />
                                                </>
                                            )}
                                        </div>

                                        {/* Conversions */}
                                        <div className="mt-3 flex gap-2 text-slate-500 text-xs">
                                            <span>1 cas. = {a.uniteParCasier} btl.</span>
                                            <span>·</span>
                                            <span>1 pal. = {a.uniteParPalette} btl.</span>
                                        </div>

                                        {a.estConsigne && (
                                            <div className="mt-2">
                                                <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg">
                                                    🔄 Avec consigne
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {modalFamille && (
                <ModalFamille tenantId={tenantId} onSuccess={fetchData} onClose={() => setModalFamille(false)} />
            )}
            {modalMarque && (
                <ModalMarque tenantId={tenantId} familles={familles} onSuccess={fetchData} onClose={() => setModalMarque(false)} />
            )}
            {modalArticle && (
                <ModalArticle
                    tenantId={tenantId}
                    familles={familles}
                    article={articleEdit}
                    onSuccess={fetchData}
                    onClose={() => { setModalArticle(false); setArticleEdit(null); }}
                />
            )}
        </div>
    );
}