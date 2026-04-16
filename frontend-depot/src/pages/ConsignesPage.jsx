import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// ── Labels lisibles pour les types ─────────────────────────
const LABELS_TYPES = {
    BOUTEILLE_33CL: { label: 'Bouteille 33cl', emoji: '🍺', defaut: 100 },
    BOUTEILLE_60CL: { label: 'Bouteille 60/65cl', emoji: '🍺', defaut: 150 },
    CASIER: { label: 'Casier', emoji: '📦', defaut: 1200 },
    PALETTE: { label: 'Palette', emoji: '🏗️', defaut: 4000 },
    PACK_EAU: { label: "Pack d'eau", emoji: '💧', defaut: 0 },
};

const TYPES_DISPONIBLES = Object.keys(LABELS_TYPES);

// ── Modal Configuration Type Consigne ──────────────────────
function ModalConfigType({ tenantId, typesExistants, onSuccess, onClose }) {
    const typesManquants = TYPES_DISPONIBLES.filter(
        t => !typesExistants.find(e => e.type === t)
    );
    const [form, setForm] = useState({
        type: typesManquants[0] || '',
        valeurXAF: typesManquants[0] ? LABELS_TYPES[typesManquants[0]].defaut : 0,
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await api.post('/consignes/types', { ...form, tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur création');
        } finally {
            setLoading(false);
        }
    };

    if (typesManquants.length === 0) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-white font-bold mb-4">Tous les types de consignes sont déjà configurés !</p>
                <button onClick={onClose} className="bg-slate-800 text-slate-300 font-bold py-3 px-6 rounded-xl">Fermer</button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">⚙️ Configurer un Type</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Définit la valeur de consigne en FCFA pour chaque emballage
                </p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Type d'emballage *
                        </label>
                        <select required value={form.type}
                            onChange={e => setForm({
                                ...form,
                                type: e.target.value,
                                valeurXAF: LABELS_TYPES[e.target.value]?.defaut || 0
                            })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            {typesManquants.map(t => (
                                <option key={t} value={t}>
                                    {LABELS_TYPES[t].emoji} {LABELS_TYPES[t].label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Valeur de consigne (FCFA) *
                        </label>
                        <input type="number" min="0" required
                            value={form.valeurXAF}
                            onChange={e => setForm({ ...form, valeurXAF: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                        <p className="text-slate-600 text-xs mt-1">
                            Valeur standard brasseries : Bouteille 33cl=100F, 60cl=150F, Casier=1200F
                        </p>
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Description (optionnel)
                        </label>
                        <input value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Ex: Consigne standard SABC"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : 'Configurer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Modifier Valeur ───────────────────────────────────
function ModalModifierValeur({ typeConsigne, tenantId, onSuccess, onClose }) {
    const [valeur, setValeur] = useState(typeConsigne.valeurXAF);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/consignes/types/${typeConsigne.id}`, { valeurXAF: Number(valeur) }, { params: { tenantId } });
            onSuccess();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const label = LABELS_TYPES[typeConsigne.type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">
                    ✏️ Modifier {label?.emoji} {label?.label}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Nouvelle valeur (FCFA)
                        </label>
                        <input type="number" min="0" required
                            value={valeur} onChange={e => setValeur(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-xl font-black text-center focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
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

// ── Modal Rendu Sans Achat ──────────────────────────────────
function ModalRenduSansAchat({ tenantId, typesConsigne, clients, onSuccess, onClose }) {
    const [form, setForm] = useState({
        clientId: '',
        typeConsigneId: '',
        quantite: 1,
        estRemboursementCash: false,
    });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');
    const [resultat, setResultat] = useState(null);

    const typeSelectionne = typesConsigne.find(t => t.id === form.typeConsigneId);
    const montantEstime = typeSelectionne ? form.quantite * typeSelectionne.valeurXAF : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            const res = await api.post('/consignes/rendu-sans-achat', {
                ...form,
                quantite: Number(form.quantite),
                tenantId,
            });
            setResultat(res.data);
            onSuccess();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    if (resultat) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
                <p className="text-5xl mb-4">✅</p>
                <h3 className="text-white font-black text-xl mb-2">Rendu enregistré !</h3>
                <p className={`font-bold text-lg mb-2 ${resultat.mode === 'CASH' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {resultat.mode === 'CASH' ? '💵' : '📋'} {resultat.mode}
                </p>
                <p className="text-slate-400 text-sm mb-6">{resultat.message}</p>
                <button onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">
                    Fermer
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">🔄 Rendu Sans Achat</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Le client rend des vides sans acheter. Choisir le mode de compensation.
                </p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client *</label>
                        <select required value={form.clientId}
                            onChange={e => setForm({ ...form, clientId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Sélectionner un client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type *</label>
                            <select required value={form.typeConsigneId}
                                onChange={e => setForm({ ...form, typeConsigneId: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                <option value="">Type...</option>
                                {typesConsigne.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {LABELS_TYPES[t.type]?.emoji} {LABELS_TYPES[t.type]?.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Quantité *</label>
                            <input type="number" min="1" required
                                value={form.quantite}
                                onChange={e => setForm({ ...form, quantite: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* Montant estimé */}
                    {montantEstime > 0 && (
                        <div className="bg-slate-800 rounded-xl p-3 flex justify-between text-sm">
                            <span className="text-slate-400">Valeur des vides</span>
                            <span className="text-white font-black">{montantEstime.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    )}

                    {/* Mode compensation */}
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                            Mode de compensation *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button"
                                onClick={() => setForm({ ...form, estRemboursementCash: false })}
                                className={`p-4 rounded-xl border text-left transition-all ${!form.estRemboursementCash
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-slate-800 border-slate-600 text-slate-400'
                                    }`}>
                                <p className="text-xl mb-1">📋</p>
                                <p className="font-bold text-sm">Avoir</p>
                                <p className="text-xs opacity-70">Crédit sur prochaine commande</p>
                            </button>
                            <button type="button"
                                onClick={() => setForm({ ...form, estRemboursementCash: true })}
                                className={`p-4 rounded-xl border text-left transition-all ${form.estRemboursementCash
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-slate-800 border-slate-600 text-slate-400'
                                    }`}>
                                <p className="text-xl mb-1">💵</p>
                                <p className="font-bold text-sm">Cash</p>
                                <p className="text-xs opacity-70">Remboursement immédiat</p>
                            </button>
                        </div>
                    </div>

                    {form.estRemboursementCash && montantEstime > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-400 font-bold text-center">
                            💵 Remettre {montantEstime.toLocaleString('fr-FR')} FCFA en cash au client
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className={`flex-1 text-white font-bold py-3 rounded-xl transition-all ${form.estRemboursementCash
                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                } disabled:opacity-40`}>
                            {loading ? '...' : form.estRemboursementCash ? '💵 Rembourser' : '📋 Créer Avoir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page Principale Consignes ───────────────────────────────
export default function ConsignesPage() {
    const { tenantId } = useAuth();
    const [typesConsigne, setTypesConsigne] = useState([]);
    const [inventaire, setInventaire] = useState([]);
    const [portefeuilles, setPortefeuilles] = useState([]);
    const [historique, setHistorique] = useState([]);
    const [stats, setStats] = useState(null);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('inventaire');
    const [modalConfig, setModalConfig] = useState(false);
    const [typeEdit, setTypeEdit] = useState(null);
    const [modalRendu, setModalRendu] = useState(false);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resTypes, resInv, resPorf, resHist, resStats, resClients] = await Promise.all([
                api.get('/consignes/types', { params: { tenantId } }),
                api.get('/consignes/inventaire', { params: { tenantId } }),
                api.get('/consignes/portefeuilles', { params: { tenantId } }),
                api.get('/consignes/historique', { params: { tenantId, limit: 50 } }),
                api.get('/consignes/stats', { params: { tenantId } }),
                api.get('/clients', { params: { tenantId } }),
            ]);
            setTypesConsigne(Array.isArray(resTypes.data) ? resTypes.data : []);
            setInventaire(Array.isArray(resInv.data) ? resInv.data : []);
            setPortefeuilles(Array.isArray(resPorf.data) ? resPorf.data : []);
            setHistorique(Array.isArray(resHist.data) ? resHist.data : []);
            setStats(resStats.data);
            setClients(Array.isArray(resClients.data) ? resClients.data : []);
        } catch (err) {
            console.error('Erreur consignes:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Consignes & Vides</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Blindage financier — Inventaire emballages — Portefeuille clients
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button onClick={() => setModalConfig(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        ⚙️ Configurer
                    </button>
                    <button onClick={() => setModalRendu(true)}
                        disabled={typesConsigne.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
                        🔄 Rendu Sans Achat
                    </button>
                </div>
            </div>

            {/* Message si pas encore configuré */}
            {typesConsigne.length === 0 && !loading && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8 flex items-center gap-4">
                    <span className="text-3xl">⚙️</span>
                    <div>
                        <p className="text-orange-400 font-black">Configuration requise</p>
                        <p className="text-slate-400 text-sm mt-1">
                            Configurez d'abord les types de consignes (valeurs FCFA) avant de commencer.
                        </p>
                    </div>
                    <button onClick={() => setModalConfig(true)}
                        className="ml-auto bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-sm shrink-0">
                        Configurer →
                    </button>
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Vides au Dépôt</p>
                        <p className="text-white text-2xl font-black">{stats.totalVidesDepot}</p>
                        <p className="text-slate-500 text-xs mt-1">
                            {stats.valeurVidesDepot.toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Dus par Clients</p>
                        <p className="text-white text-2xl font-black">
                            {stats.totalDuClients.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-1">{stats.nbClientsAvecConsignes} client(s)</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Remb. Cash/Mois</p>
                        <p className="text-white text-2xl font-black">
                            {stats.remboursementsMois.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-1">{stats.nbRemboursements} opération(s)</p>
                    </div>
                </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    ['inventaire', '🏭 Inventaire Vides'],
                    ['configuration', '⚙️ Configuration'],
                    ['portefeuilles', `👤 Portefeuilles Clients (${portefeuilles.length})`],
                    ['historique', '📋 Historique'],
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

            {/* ── Onglet Inventaire ── */}
            {onglet === 'inventaire' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-800 rounded-2xl animate-pulse" />)
                    ) : inventaire.length === 0 ? (
                        <div className="col-span-3 text-center py-16 text-slate-500 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <p className="text-4xl mb-3">📦</p>
                            <p>Aucun type de consigne configuré</p>
                        </div>
                    ) : inventaire.map(inv => {
                        const label = LABELS_TYPES[inv.typeConsigne.type];
                        const isOk = inv.stockVides > 10;
                        return (
                            <div key={inv.typeConsigne.id}
                                className={`rounded-2xl p-5 border ${inv.stockVides <= 0 ? 'bg-red-500/10 border-red-500/30'
                                        : inv.stockVides <= 5 ? 'bg-orange-500/10 border-orange-500/30'
                                            : 'bg-slate-800/50 border-slate-700'
                                    }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-2xl mb-1">{label?.emoji}</p>
                                        <p className="text-white font-black">{label?.label}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            {inv.typeConsigne.valeurXAF.toLocaleString('fr-FR')} FCFA/unité
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-3xl font-black ${inv.stockVides <= 0 ? 'text-red-400'
                                                : inv.stockVides <= 5 ? 'text-orange-400'
                                                    : 'text-white'
                                            }`}>
                                            {inv.stockVides}
                                        </p>
                                        <p className="text-slate-500 text-xs">en stock</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-500">↑ Rentrés</p>
                                        <p className="text-emerald-400 font-bold">{inv.totalEntrees}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">↓ Sortis</p>
                                        <p className="text-red-400 font-bold">{inv.totalSorties}</p>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    Valeur totale :
                                    <span className="text-indigo-400 font-bold ml-1">
                                        {inv.valeurTotale.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Onglet Configuration ── */}
            {onglet === 'configuration' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-slate-400 text-sm">
                            Configurez les valeurs de consigne en FCFA pour chaque type d'emballage.
                            Ces valeurs servent au calcul automatique de la caution lors des ventes.
                        </p>
                        <button onClick={() => setModalConfig(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shrink-0 ml-4">
                            + Ajouter
                        </button>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        {typesConsigne.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-4xl mb-3">⚙️</p>
                                <p>Aucun type configuré</p>
                                <button onClick={() => setModalConfig(true)}
                                    className="mt-4 text-indigo-400 text-sm font-bold">
                                    + Configurer le premier type
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4 text-right">Valeur (FCFA)</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {typesConsigne.map(t => {
                                        const label = LABELS_TYPES[t.type];
                                        return (
                                            <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{label?.emoji}</span>
                                                        <p className="text-white font-bold">{label?.label}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-sm">
                                                    {t.description || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-indigo-400 font-black text-lg">
                                                        {t.valeurXAF.toLocaleString('fr-FR')}
                                                    </span>
                                                    <span className="text-slate-500 text-xs ml-1">FCFA</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setTypeEdit(t)}
                                                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                                        ✏️ Modifier
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Onglet Portefeuilles Clients ── */}
            {onglet === 'portefeuilles' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : portefeuilles.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 bg-slate-800/50 border border-slate-700 rounded-2xl">
                            <p className="text-4xl mb-3">👤</p>
                            <p className="font-semibold">Aucun client avec des consignes en cours</p>
                        </div>
                    ) : portefeuilles.map(p => (
                        <div key={p.client.id}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-400 font-black">
                                        {p.client.nom[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-black">{p.client.nom}</p>
                                        <p className="text-slate-500 text-xs">{p.client.telephone || '—'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-orange-400 font-black text-lg">
                                        {p.valeurTotale.toLocaleString('fr-FR')} FCFA
                                    </p>
                                    <p className="text-slate-500 text-xs">valeur des consignes dues</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {p.consignes.map(c => {
                                    const label = LABELS_TYPES[c.typeConsigne.type];
                                    return (
                                        <div key={c.id}
                                            className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                                            <span>{label?.emoji}</span>
                                            <span className="text-orange-400 font-bold text-sm">
                                                {c.quantite} × {label?.label}
                                            </span>
                                            <span className="text-slate-500 text-xs">
                                                = {(c.quantite * c.typeConsigne.valeurXAF).toLocaleString('fr-FR')} F
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Onglet Historique ── */}
            {onglet === 'historique' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {historique.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">📋</p>
                            <p>Aucun mouvement enregistré</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Mouvement</th>
                                    <th className="px-6 py-4 text-center">Quantité</th>
                                    <th className="px-6 py-4">Motif</th>
                                    <th className="px-6 py-4">Remb. Cash</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {historique.map(m => {
                                    const label = LABELS_TYPES[m.typeConsigne?.type];
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span>{label?.emoji}</span>
                                                    <span className="text-slate-300 text-sm">{label?.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${m.estSortie
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {m.estSortie ? '↓ Sortie' : '↑ Entrée'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-black ${m.estSortie ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {m.estSortie ? '-' : '+'}{m.quantite}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs max-w-xs truncate">
                                                {m.motif || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.estRemboursementCash ? (
                                                    <span className="text-emerald-400 font-bold text-sm">
                                                        💵 {m.montantRembourse.toLocaleString('fr-FR')} F
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {new Date(m.createdAt).toLocaleDateString('fr-FR')}{' '}
                                                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modals */}
            {modalConfig && (
                <ModalConfigType
                    tenantId={tenantId} typesExistants={typesConsigne}
                    onSuccess={fetchData} onClose={() => setModalConfig(false)}
                />
            )}
            {typeEdit && (
                <ModalModifierValeur
                    typeConsigne={typeEdit} tenantId={tenantId}
                    onSuccess={fetchData} onClose={() => setTypeEdit(null)}
                />
            )}
            {modalRendu && (
                <ModalRenduSansAchat
                    tenantId={tenantId} typesConsigne={typesConsigne} clients={clients}
                    onSuccess={fetchData} onClose={() => setModalRendu(false)}
                />
            )}
        </div>
    );
}