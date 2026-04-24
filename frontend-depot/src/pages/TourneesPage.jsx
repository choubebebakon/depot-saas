import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

// â”€â”€ Badge statut tournée â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BadgeStatut({ statut }) {
    const config = {
        OUVERTE: { label: 'â— En cours', classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        CLOTURE_COMMERCIALE: { label: 'â³ Attente Magasinier', classes: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
        VALIDEE: { label: 'âœ“ Validée', classes: 'bg-slate-700 border-slate-600 text-slate-400' },
        ANNULEE: { label: 'âœ• Annulée', classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
    };
    const c = config[statut] || config.ANNULEE;
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${c.classes}`}>{c.label}</span>
    );
}

// â”€â”€ Modal Nouveau Commercial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalNouveauCommercial({ tenantId, onSuccess, onClose }) {
    const [form, setForm] = useState({ nom: '', email: '', password: '' });
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');
        if (form.password.length < 6) { setErreur('Mot de passe minimum 6 caractères.'); return; }
        setLoading(true);
        try {
            await api.post('/users', { ...form, role: 'COMMERCIAL', tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur création commercial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center text-lg">ðŸ‘¤</div>
                    <div>
                        <h3 className="text-white font-black text-lg">Nouveau Commercial</h3>
                        <p className="text-slate-400 text-xs">Accès tournées et ventes terrain</p>
                    </div>
                </div>

                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prénom & Nom *</label>
                        <input required value={form.nom}
                            onChange={e => setForm({ ...form, nom: e.target.value })}
                            placeholder="Ex: Jean Kamgaing"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-all" />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email *</label>
                        <input required type="email" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            placeholder="jean@depot.cm"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-all" />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mot de passe *</label>
                        <input required type="password" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="Min. 6 caractères"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-all" />
                    </div>

                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-violet-300 text-xs">
                        ðŸ” Le commercial pourra se connecter et gérer ses tournées avec ces identifiants.
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-all">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? 'â³ Création...' : 'ðŸ‘¤ Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Nouveau Tricycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalNouveauTricycle({ tenantId, onSuccess, onClose }) {
    const [nom, setNom] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/tournees/tricycles', { nom, tenantId });
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
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-lg">ðŸ›º</div>
                    <div>
                        <h3 className="text-white font-black text-lg">Nouveau Tricycle</h3>
                        <p className="text-slate-400 text-xs">Véhicule de livraison terrain</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom du tricycle *</label>
                        <input required value={nom} onChange={e => setNom(e.target.value)}
                            placeholder="Ex: Tricycle Alpha"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-all">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : 'ðŸ›º Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Ouvrir Tournée â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalOuvrirTournee({ tenantId, depotId, tricycles, users, onSuccess, onClose }) {
    const [form, setForm] = useState({ tricycleId: '', commercialId: '' });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const tricyclesLibres = tricycles.filter(t => t.estLibre);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!depotId) { setErreur('Sélectionnez un Dépôt dans le menu.'); return; }
        setLoading(true);
        setErreur('');
        try {
            await api.post('/tournees/ouvrir', { ...form, depotId, tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur ouverture');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">ðŸ›º Ouvrir une Tournée</h3>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                {tricyclesLibres.length === 0 && (
                    <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm rounded-xl">
                        âš ï¸ Aucun tricycle libre disponible. Clôturez une tournée en cours d'abord.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Tricycle *</label>
                        <select required value={form.tricycleId} onChange={e => setForm({ ...form, tricycleId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Choisir un tricycle libre...</option>
                            {tricyclesLibres.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Commercial *</label>
                        <select required value={form.commercialId} onChange={e => setForm({ ...form, commercialId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Choisir un commercial...</option>
                            {users.length === 0 && <option disabled>âš ï¸ Aucun commercial enregistré</option>}
                            {users.map(u => <option key={u.id} value={u.id}>{u.nom || u.email}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading || tricyclesLibres.length === 0}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'ðŸš€ Ouvrir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Chargement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalChargement({ tournee, tenantId, articles, onSuccess, onClose }) {
    const [lignes, setLignes] = useState([{ articleId: '', quantiteChargee: 1 }]);
    const [stocksDépôt, setStocksDépôt] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStocks, setLoadingStocks] = useState(true);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const res = await api.get('/stocks', {
                    params: { tenantId, depotId: tournee.depotId }
                });
                setStocksDépôt(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Erreur chargement stocks Dépôt:", err);
            } finally {
                setLoadingStocks(false);
            }
        };
        if (tournee.depotId) fetchStocks();
    }, [tournee.depotId, tenantId]);

    const getStockDispo = (articleId) => {
        const s = stocksDépôt.find(s => s.articleId === articleId);
        return s ? s.quantite : 0;
    };

    const updateLigne = (i, champ, val) => {
        const copy = [...lignes];
        copy[i][champ] = val;
        setLignes(copy);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await api.post('/tournees/charger', {
                tourneeId: tournee.id,
                tenantId,
                lignes: lignes.map(l => ({ articleId: l.articleId, quantiteChargee: Number(l.quantiteChargee) })),
            });
            window.dispatchEvent(new CustomEvent('refresh-stocks'));
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur chargement');
        } finally {
            setLoading(false);
        }
    };

    // Trier les articles par quantité dispo (ceux avec du stock en premier)
    const articlesAffichage = [...articles].sort((a, b) => {
        const stockA = getStockDispo(a.id);
        const stockB = getStockDispo(b.id);
        return stockB - stockA;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl my-4">
                <h3 className="text-white font-black text-xl mb-2">ðŸ“¦ Chargement du Tricycle</h3>
                <p className="text-slate-400 text-sm mb-1">
                    Tournée <strong className="text-indigo-400">{tournee.reference}</strong> â€” {tournee.tricycle?.nom}
                </p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-6">
                    Dépôt : {tournee.Dépôt?.nom || 'Dépôt'}
                </p>

                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        {lignes.map((l, i) => {
                            const dispo = getStockDispo(l.articleId);
                            const estInsuffisant = l.articleId && l.quantiteChargee > dispo;

                            return (
                                <div key={i} className="space-y-1">
                                    <div className="flex gap-3 items-center">
                                        <select required value={l.articleId} onChange={e => updateLigne(i, 'articleId', e.target.value)}
                                            className={`flex-1 bg-slate-800 border ${l.articleId && dispo <= 0 ? 'border-orange-500/50' : 'border-slate-600'} text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500`}>
                                            <option value="">Choisir article...</option>
                                            {articlesAffichage.map(a => {
                                                const s = getStockDispo(a.id);
                                                return (
                                                    <option key={a.id} value={a.id} className={s <= 0 ? 'text-slate-500' : 'text-white'}>
                                                        {a.designation} ({s} dispo)
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <input type="number" min="1" required value={l.quantiteChargee}
                                            onChange={e => updateLigne(i, 'quantiteChargee', e.target.value)}
                                            className={`w-24 bg-slate-800 border ${estInsuffisant ? 'border-red-500/50 text-red-400' : 'border-slate-600 text-white'} rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-indigo-500`} />
                                        {lignes.length > 1 && (
                                            <button type="button" onClick={() => setLignes(lignes.filter((_, idx) => idx !== i))}
                                                className="text-red-400 hover:text-red-300 p-1">âœ•</button>
                                        )}
                                    </div>
                                    {estInsuffisant && (
                                        <p className="text-[10px] text-red-400 font-bold uppercase pl-1 animate-pulse">
                                            âš ï¸ Stock insuffisant (Max: {dispo})
                                        </p>
                                    )}
                                    {l.articleId && !estInsuffisant && dispo > 0 && (
                                        <p className="text-[10px] text-emerald-400 font-medium pl-1">
                                            âœ“ {dispo} unités disponibles au dépôt
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button type="button"
                        onClick={() => setLignes([...lignes, { articleId: '', quantiteChargee: 1 }])}
                        className="w-full border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-2 text-sm font-semibold transition-all">
                        + Ajouter un article
                    </button>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading || loadingStocks}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'ðŸ“¦ Charger'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Clôture Commerciale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalClotureCommerciale({ tournee, tenantId, onSuccess, onClose }) {
    const [form, setForm] = useState({ cashRemis: 0, omRemis: 0, momoRemis: 0, noteCloture: '' });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const totalRemis = Number(form.cashRemis) + Number(form.omRemis) + Number(form.momoRemis);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await api.post('/tournees/cloture-commerciale', {
                tourneeId: tournee.id,
                tenantId,
                cashRemis: Number(form.cashRemis),
                omRemis: Number(form.omRemis),
                momoRemis: Number(form.momoRemis),
                noteCloture: form.noteCloture,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur clôture');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">ðŸ”’ Clôture Commerciale</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Tournée <strong className="text-indigo-400">{tournee.reference}</strong><br />
                    Le magasinier devra ensuite valider le retour physique des stocks.
                </p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { key: 'cashRemis', label: 'ðŸ’µ Cash remis (FCFA)' },
                        { key: 'omRemis', label: 'ðŸ“± Orange Money remis (FCFA)' },
                        { key: 'momoRemis', label: 'ðŸ“² MTN MoMo remis (FCFA)' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">{f.label}</label>
                            <input type="number" min="0" value={form[f.key]}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    ))}

                    <div className="bg-slate-800 rounded-xl p-4 flex justify-between">
                        <span className="text-slate-400 font-bold">Total remis</span>
                        <span className="text-white font-black">{totalRemis.toLocaleString('fr-FR')} FCFA</span>
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Note (optionnel)</label>
                        <input value={form.noteCloture} onChange={e => setForm({ ...form, noteCloture: e.target.value })}
                            placeholder="Remarques, incidents..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'ðŸ”’ Clôturer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Validation Magasinier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalValidationMagasinier({ tournee, tenantId, onSuccess, onClose }) {
    const [retours, setRetours] = useState(
        tournee.lignesChargement?.map(l => ({
            articleId: l.articleId,
            designation: l.article?.designation || '',
            quantiteChargee: l.quantiteChargee,
            quantiteVendue: l.quantiteVendue,
            attendu: l.quantiteChargee - l.quantiteVendue,
            quantiteRetour: l.quantiteChargee - l.quantiteVendue,
        })) || []
    );
    const [noteValidation, setNoteValidation] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const updateRetour = (i, val) => {
        const copy = [...retours];
        copy[i].quantiteRetour = Number(val);
        setRetours(copy);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await api.post('/tournees/valider-magasinier', {
                tourneeId: tournee.id,
                tenantId,
                lignesRetour: retours.map(r => ({ articleId: r.articleId, quantiteRetour: r.quantiteRetour })),
                noteValidation,
            });
            window.dispatchEvent(new CustomEvent('refresh-stocks'));
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur validation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl my-4">
                <h3 className="text-white font-black text-xl mb-2">âœ… Validation Magasinier</h3>
                <p className="text-orange-400 text-sm mb-6 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
                    âš ï¸ Comptez physiquement les articles retournés avant de valider.
                </p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="grid grid-cols-4 text-slate-500 text-xs font-bold uppercase tracking-widest px-1">
                            <span className="col-span-2">Article</span>
                            <span className="text-center">Attendu</span>
                            <span className="text-center">Compté</span>
                        </div>
                        {retours.map((r, i) => {
                            const ecart = r.quantiteRetour - r.attendu;
                            return (
                                <div key={i} className={`grid grid-cols-4 items-center gap-3 bg-slate-800 rounded-xl p-3 ${ecart !== 0 ? 'border border-orange-500/30' : ''}`}>
                                    <div className="col-span-2">
                                        <p className="text-white text-sm font-semibold">{r.designation}</p>
                                        <p className="text-slate-500 text-xs">Chargé: {r.quantiteChargee}</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-indigo-400 font-black">{r.attendu}</span>
                                    </div>
                                    <div className="text-center">
                                        <input type="number" min="0" max={r.quantiteChargee}
                                            value={r.quantiteRetour}
                                            onChange={e => updateRetour(i, e.target.value)}
                                            className={`w-16 text-center font-black rounded-lg px-2 py-1 text-sm border focus:outline-none ${ecart < 0 ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                                    : ecart > 0 ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                                                        : 'bg-slate-700 border-slate-600 text-white'
                                                }`} />
                                        {ecart !== 0 && (
                                            <p className={`text-xs mt-1 font-bold ${ecart < 0 ? 'text-red-400' : 'text-orange-400'}`}>
                                                {ecart > 0 ? '+' : ''}{ecart}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Note validation</label>
                        <input value={noteValidation} onChange={e => setNoteValidation(e.target.value)}
                            placeholder="RAS / Écart constaté sur..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'âœ… Valider & Libérer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Page Principale Tournées â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TourneesPage() {
    const { tenantId } = useAuth();
    const { depotId } = useDepot();
    const [tournees, setTournees] = useState([]);
    const [tricycles, setTricycles] = useState([]);
    const [articles, setArticles] = useState([]);
    const [users, setUsers] = useState([]); // Uniquement les COMMERCIAUXs
    const [stats, setStats] = useState({ actives: 0, attenteMagasinier: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('actives');

    // Modals
    const [modalCommercial, setModalCommercial] = useState(false);
    const [modalTricycle, setModalTricycle] = useState(false);
    const [modalOuvrir, setModalOuvrir] = useState(false);
    const [tourneeChargement, setTourneeChargement] = useState(null);
    const [tourneeCloture, setTourneeCloture] = useState(null);
    const [tourneeValidation, setTourneeValidation] = useState(null);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resT, resTr, resA, resU, resS] = await Promise.all([
                api.get('/tournees', { params: { tenantId, depotId } }),
                api.get('/tournees/tricycles', { params: { tenantId } }),
                api.get('/articles', { params: { tenantId } }),
                api.get('/users/commerciaux', { params: { tenantId } }), // â† Filtre COMMERCIAL uniquement
                api.get('/tournees/stats', { params: { tenantId } }),
            ]);
            setTournees(Array.isArray(resT.data) ? resT.data : []);
            setTricycles(Array.isArray(resTr.data) ? resTr.data : []);
            setArticles(Array.isArray(resA.data) ? resA.data : []);
            setUsers(Array.isArray(resU.data) ? resU.data : []);
            setStats(resS.data);
        } catch (err) {
            console.error('Erreur tournées:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, depotId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const tourneesFiltrees = tournees.filter(t => {
        if (onglet === 'actives') return ['OUVERTE', 'CLOTURE_COMMERCIALE'].includes(t.statut);
        if (onglet === 'attente') return t.statut === 'CLOTURE_COMMERCIALE';
        if (onglet === 'historique') return t.statut === 'VALIDEE';
        return true;
    });

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Tournées Tricycle</h1>
                    <p className="text-slate-400 text-sm mt-1">Chargement, ventes terrain et validation magasinier</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button onClick={() => setModalCommercial(true)}
                        className="bg-violet-700 hover:bg-violet-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all border border-violet-500/30">
                        ðŸ‘¤ Nouveau Commercial
                    </button>
                    <button onClick={() => setModalTricycle(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        ðŸ›º Tricycle
                    </button>
                    <button onClick={() => setModalOuvrir(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
                        ðŸš€ Nouvelle Tournée
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">En cours</p>
                    <p className="text-white text-3xl font-black">{stats.actives}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Attente Magasinier</p>
                    <p className="text-white text-3xl font-black">{stats.attenteMagasinier}</p>
                    {stats.attenteMagasinier > 0 && (
                        <p className="text-orange-400 text-xs mt-1 font-bold animate-pulse">âš ï¸ Action requise</p>
                    )}
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total tournées</p>
                    <p className="text-white text-3xl font-black">{stats.total}</p>
                </div>
            </div>

            {/* Tricycles */}
            <div className="mb-8">
                <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-widest text-slate-400">
                    ðŸ›º État des Tricycles
                </h2>
                <div className="flex flex-wrap gap-3">
                    {/* Compteur commerciaux */}
                    {users.length === 0 && (
                        <button onClick={() => setModalCommercial(true)}
                            className="border border-dashed border-violet-600/40 hover:border-violet-500 text-slate-500 hover:text-violet-400 px-5 py-3 rounded-xl text-sm font-semibold transition-all">
                            ðŸ‘¤ Enregistrer un commercial d'abord
                        </button>
                    )}
                    {tricycles.length === 0 ? (
                        <button onClick={() => setModalTricycle(true)}
                            className="border border-dashed border-slate-600 hover:border-indigo-500 text-slate-500 hover:text-indigo-400 px-5 py-3 rounded-xl text-sm font-semibold transition-all">
                            + Créer un tricycle
                        </button>
                    ) : tricycles.map(t => (
                        <div key={t.id} className={`px-4 py-3 rounded-xl border font-bold text-sm ${t.estLibre
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            }`}>
                            {t.nom} {t.estLibre ? 'â— Libre' : 'â³ En tournée'}
                            {!t.estLibre && t.tournees?.[0] && (
                                <span className="text-xs ml-2 opacity-70">â€” {t.tournees[0].commercial?.email}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    ['actives', `ðŸŸ¢ En cours (${stats.actives})`],
                    ['attente', `â³ Attente Magasinier (${stats.attenteMagasinier})`],
                    ['historique', 'ðŸ“‹ Historique'],
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

            {/* Liste tournées */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tourneesFiltrees.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-800/50 border border-slate-700 rounded-2xl">
                        <p className="text-4xl mb-3">ðŸ›º</p>
                        <p className="font-semibold">Aucune tournée {onglet === 'actives' ? 'en cours' : onglet === 'attente' ? 'en attente' : 'dans l\'historique'}</p>
                        {onglet === 'actives' && (
                            <button onClick={() => setModalOuvrir(true)}
                                className="mt-4 text-emerald-400 text-sm font-bold">ðŸš€ Lancer une tournée</button>
                        )}
                    </div>
                ) : tourneesFiltrees.map(tournee => (
                    <div key={tournee.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                            {/* Infos tournée */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <span className="text-indigo-400 font-black">{tournee.reference}</span>
                                    <BadgeStatut statut={tournee.statut} />
                                    {tournee.ecartStock > 0 && (
                                        <span className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                                            âš ï¸ Écart: {tournee.ecartStock} unités
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs">Tricycle</p>
                                        <p className="text-white font-bold">{tournee.tricycle?.nom}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Commercial</p>
                                        <p className="text-white font-bold text-xs">{tournee.commercial?.nom || tournee.commercial?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Dépôt</p>
                                        <p className="text-white font-bold">{tournee.Dépôt?.nom}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Ouverture</p>
                                        <p className="text-white font-bold text-xs">
                                            {new Date(tournee.dateOuverture).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                </div>

                                {/* Lignes chargement */}
                                {tournee.lignesChargement?.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {tournee.lignesChargement.map(l => (
                                            <span key={l.id} className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-lg">
                                                {l.article?.designation} Ã— {l.quantiteChargee}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Encaissements si clôturée */}
                                {tournee.statut === 'CLOTURE_COMMERCIALE' && (
                                    <div className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-4 text-sm flex-wrap">
                                        <span className="text-orange-400">ðŸ’µ Cash: <strong>{tournee.cashRemis?.toLocaleString('fr-FR')} FCFA</strong></span>
                                        <span className="text-orange-400">ðŸ“± OM: <strong>{tournee.omRemis?.toLocaleString('fr-FR')} FCFA</strong></span>
                                        <span className="text-orange-400">ðŸ“² MoMo: <strong>{tournee.momoRemis?.toLocaleString('fr-FR')} FCFA</strong></span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 min-w-[160px]">
                                {tournee.statut === 'OUVERTE' && (
                                    <>
                                        <button onClick={() => setTourneeChargement(tournee)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all text-center">
                                            ðŸ“¦ Charger
                                        </button>
                                        <button onClick={() => setTourneeCloture(tournee)}
                                            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all text-center">
                                            ðŸ”’ Clôture Commerciale
                                        </button>
                                    </>
                                )}
                                {tournee.statut === 'CLOTURE_COMMERCIALE' && (
                                    <button onClick={() => setTourneeValidation(tournee)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all text-center animate-pulse">
                                        âœ… Valider (Magasinier)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {modalCommercial && (
                <ModalNouveauCommercial tenantId={tenantId} onSuccess={fetchData} onClose={() => setModalCommercial(false)} />
            )}
            {modalTricycle && (
                <ModalNouveauTricycle tenantId={tenantId} onSuccess={fetchData} onClose={() => setModalTricycle(false)} />
            )}
            {modalOuvrir && (
                <ModalOuvrirTournee
                    tenantId={tenantId} depotId={depotId}
                    tricycles={tricycles} users={users}
                    onSuccess={fetchData} onClose={() => setModalOuvrir(false)}
                />
            )}
            {tourneeChargement && (
                <ModalChargement
                    tournee={tourneeChargement} tenantId={tenantId} articles={articles}
                    onSuccess={fetchData} onClose={() => setTourneeChargement(null)}
                />
            )}
            {tourneeCloture && (
                <ModalClotureCommerciale
                    tournee={tourneeCloture} tenantId={tenantId}
                    onSuccess={fetchData} onClose={() => setTourneeCloture(null)}
                />
            )}
            {tourneeValidation && (
                <ModalValidationMagasinier
                    tournee={tourneeValidation} tenantId={tenantId}
                    onSuccess={fetchData} onClose={() => setTourneeValidation(null)}
                />
            )}
        </div>
    );
}




