import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const TYPES_MAINTENANCE = {
    VIDANGE: { label: 'Vidange', emoji: '🛢️', couleur: 'blue' },
    PNEU: { label: 'Pneu', emoji: '⚫', couleur: 'slate' },
    FREINS: { label: 'Freins', emoji: '🔴', couleur: 'red' },
    CARBURANT: { label: 'Carburant', emoji: '⛽', couleur: 'yellow' },
    REPARATION: { label: 'Réparation', emoji: '🔧', couleur: 'orange' },
    REVISION: { label: 'Révision', emoji: '🔍', couleur: 'purple' },
    AUTRE: { label: 'Autre', emoji: '📝', couleur: 'slate' },
};

// ── Modal Nouvelle Maintenance ──────────────────────────────
function ModalMaintenance({ tenantId, tricycles, onSuccess, onClose }) {
    const [form, setForm] = useState({
        tricycleId: tricycles[0]?.id || '',
        type: 'VIDANGE',
        description: '',
        cout: '',
        kilometrage: '',
        datePlanifie: '',
        dateEffectue: '',
        estEffectue: false,
    });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur('');
        try {
            await api.post('/maintenance', {
                tricycleId: form.tricycleId,
                type: form.type,
                description: form.description,
                cout: Number(form.cout),
                kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
                datePlanifie: form.datePlanifie || undefined,
                dateEffectue: form.estEffectue ? (form.dateEffectue || new Date().toISOString()) : undefined,
                tenantId,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl my-4">
                <h3 className="text-white font-black text-xl mb-6">🔧 Nouvelle Maintenance</h3>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Tricycle *</label>
                            <select required value={form.tricycleId}
                                onChange={e => setForm({ ...form, tricycleId: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                {tricycles.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type *</label>
                            <select required value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                                {Object.entries(TYPES_MAINTENANCE).map(([k, v]) => (
                                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Description *</label>
                        <input required value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Ex: Vidange moteur + filtre à huile"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Coût (FCFA)</label>
                            <input type="number" min="0" value={form.cout}
                                onChange={e => setForm({ ...form, cout: e.target.value })}
                                placeholder="0"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Kilométrage</label>
                            <input type="number" min="0" value={form.kilometrage}
                                onChange={e => setForm({ ...form, kilometrage: e.target.value })}
                                placeholder="Ex: 12500"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* Toggle effectué maintenant */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setForm({ ...form, estEffectue: !form.estEffectue })}
                            className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${form.estEffectue ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.estEffectue ? 'left-7' : 'left-1'}`} />
                        </div>
                        <span className="text-slate-300 text-sm font-semibold">
                            {form.estEffectue ? '✅ Déjà effectuée' : '📅 Planifier pour plus tard'}
                        </span>
                    </label>

                    {!form.estEffectue && (
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date planifiée</label>
                            <input type="date" value={form.datePlanifie}
                                onChange={e => setForm({ ...form, datePlanifie: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : '🔧 Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Plein Carburant ───────────────────────────────────
function ModalCarburant({ tenantId, tricycles, onSuccess, onClose }) {
    const [form, setForm] = useState({
        tricycleId: tricycles[0]?.id || '',
        litres: '',
        prixLitre: 600,
        kilometrage: '',
        nbTours: '',
    });
    const [loading, setLoading] = useState(false);

    const montant = form.litres && form.prixLitre
        ? Number(form.litres) * Number(form.prixLitre)
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/maintenance/carburant', {
                ...form,
                litres: Number(form.litres),
                prixLitre: Number(form.prixLitre),
                kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
                nbTours: form.nbTours ? Number(form.nbTours) : 0,
                tenantId,
            });
            onSuccess();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">⛽ Plein Carburant</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Tricycle *</label>
                        <select required value={form.tricycleId}
                            onChange={e => setForm({ ...form, tricycleId: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            {tricycles.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Litres *</label>
                            <input type="number" min="0" step="0.1" required value={form.litres}
                                onChange={e => setForm({ ...form, litres: e.target.value })}
                                placeholder="Ex: 5.5"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix/litre (FCFA) *</label>
                            <input type="number" min="0" required value={form.prixLitre}
                                onChange={e => setForm({ ...form, prixLitre: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Km compteur</label>
                            <input type="number" min="0" value={form.kilometrage}
                                onChange={e => setForm({ ...form, kilometrage: e.target.value })}
                                placeholder="Ex: 12500"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nb tours</label>
                            <input type="number" min="0" value={form.nbTours}
                                onChange={e => setForm({ ...form, nbTours: e.target.value })}
                                placeholder="Ex: 3"
                                className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {montant > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Montant total</span>
                            <span className="text-yellow-400 font-black text-xl">{montant.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">
                            {loading ? '...' : '⛽ Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page Principale Maintenance ─────────────────────────────
export default function MaintenancePage() {
    const { tenantId } = useAuth();
    const [tricycles, setTricycles] = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [carburants, setCarburants] = useState([]);
    const [statsGlobales, setStatsGlobales] = useState(null);
    const [loading, setLoading] = useState(true);
    const [onglet, setOnglet] = useState('tableau-bord');
    const [tricycleFiltre, setTricycleFiltre] = useState('');
    const [modalMaintenance, setModalMaintenance] = useState(false);
    const [modalCarburant, setModalCarburant] = useState(false);

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const params = { tenantId, ...(tricycleFiltre ? { tricycleId: tricycleFiltre } : {}) };
            const [resTr, resM, resC, resS] = await Promise.all([
                api.get('/tournees/tricycles', { params: { tenantId } }),
                api.get('/maintenance', { params }),
                api.get('/maintenance/carburant', { params }),
                api.get('/maintenance/stats', { params: { tenantId } }),
            ]);
            setTricycles(Array.isArray(resTr.data) ? resTr.data : []);
            setMaintenances(Array.isArray(resM.data) ? resM.data : []);
            setCarburants(Array.isArray(resC.data) ? resC.data : []);
            setStatsGlobales(resS.data);
        } catch (err) {
            console.error('Erreur maintenance:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, tricycleFiltre]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleValider = async (id) => {
        await api.put(`/maintenance/${id}/valider`);
        fetchData();
    };

    const maintenancesEnRetard = maintenances.filter(
        m => m.statut === 'PLANIFIE' && m.datePlanifie && new Date(m.datePlanifie) < new Date()
    );

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Maintenance & Carburant</h1>
                    <p className="text-slate-400 text-sm mt-1">Carnet de santé des tricycles — Suivi des charges</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setModalCarburant(true)}
                        disabled={tricycles.length === 0}
                        className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                        ⛽ Carburant
                    </button>
                    <button onClick={() => setModalMaintenance(true)}
                        disabled={tricycles.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20">
                        🔧 Maintenance
                    </button>
                </div>
            </div>

            {/* Alerte maintenances en retard */}
            {maintenancesEnRetard.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                    <p className="text-red-400 font-black text-sm mb-2">
                        🚨 {maintenancesEnRetard.length} maintenance(s) en retard !
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {maintenancesEnRetard.map(m => {
                            const t = TYPES_MAINTENANCE[m.type];
                            return (
                                <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                                    <span>{t?.emoji}</span>
                                    <div>
                                        <p className="text-red-400 text-xs font-bold">{m.tricycle?.nom} — {t?.label}</p>
                                        <p className="text-slate-500 text-xs">Prévu le {new Date(m.datePlanifie).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <button onClick={() => handleValider(m.id)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg ml-2">
                                        ✓
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats mois */}
            {statsGlobales && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Carburant/Mois</p>
                        <p className="text-white text-2xl font-black">
                            {statsGlobales.totalMois?.carburant?.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">FCFA</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Maintenance/Mois</p>
                        <p className="text-white text-2xl font-black">
                            {statsGlobales.totalMois?.maintenance?.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">FCFA</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Litres/Mois</p>
                        <p className="text-white text-2xl font-black">{statsGlobales.totalMois?.litres?.toFixed(1)}</p>
                        <p className="text-slate-500 text-xs mt-1">litres</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Charges</p>
                        <p className="text-white text-2xl font-black">
                            {((statsGlobales.totalMois?.carburant || 0) + (statsGlobales.totalMois?.maintenance || 0)).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">FCFA ce mois</p>
                    </div>
                </div>
            )}

            {/* Filtre tricycle */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button onClick={() => setTricycleFiltre('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${!tricycleFiltre ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                    🛺 Tous les tricycles
                </button>
                {tricycles.map(t => (
                    <button key={t.id} onClick={() => setTricycleFiltre(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${tricycleFiltre === t.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                        {t.nom}
                    </button>
                ))}
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                {[
                    ['tableau-bord', '📊 Tableau de bord'],
                    ['maintenances', `🔧 Maintenances (${maintenances.length})`],
                    ['carburant', `⛽ Carburant (${carburants.length})`],
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

            {/* ── Tableau de bord par tricycle ── */}
            {onglet === 'tableau-bord' && statsGlobales && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {statsGlobales.tricycles?.map(({ tricycle, stats }) => (
                        <div key={tricycle.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-white font-black text-lg">🛺 {tricycle.nom}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border mt-1 inline-block ${tricycle.estLibre
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                        }`}>
                                        {tricycle.estLibre ? '● Libre' : '⏳ En tournée'}
                                    </span>
                                </div>
                                {stats.enRetard > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full animate-pulse">
                                        {stats.enRetard} retard
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-700/50 rounded-xl p-3">
                                    <p className="text-slate-500 text-xs mb-1">Carburant total</p>
                                    <p className="text-yellow-400 font-black">{stats.coutCarburantTotal.toLocaleString('fr-FR')} F</p>
                                    <p className="text-slate-600 text-xs">{stats.litresTotal.toFixed(1)} L</p>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-3">
                                    <p className="text-slate-500 text-xs mb-1">Maintenance total</p>
                                    <p className="text-orange-400 font-black">{stats.coutMaintenanceTotal.toLocaleString('fr-FR')} F</p>
                                    <p className="text-slate-600 text-xs">{stats.nbMaintenances} opération(s)</p>
                                </div>
                            </div>

                            <div className="mt-3 bg-slate-700/30 rounded-xl p-3 flex justify-between">
                                <span className="text-slate-400 text-sm">Coût total</span>
                                <span className="text-white font-black">{stats.coutTotal.toLocaleString('fr-FR')} FCFA</span>
                            </div>

                            {stats.toursTotal > 0 && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Conso. moy : {stats.consommationMoyenne} L/tour · {stats.toursTotal} tours effectués
                                </div>
                            )}

                            {stats.planifiees > 0 && (
                                <div className={`mt-2 text-xs font-bold ${stats.enRetard > 0 ? 'text-red-400' : 'text-orange-400'}`}>
                                    📅 {stats.planifiees} maintenance(s) planifiée(s)
                                    {stats.enRetard > 0 && ` — ${stats.enRetard} en retard !`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Liste maintenances ── */}
            {onglet === 'maintenances' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : maintenances.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">🔧</p>
                            <p>Aucune maintenance enregistrée</p>
                            <button onClick={() => setModalMaintenance(true)}
                                className="mt-4 text-indigo-400 text-sm font-bold">+ Première maintenance</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Tricycle</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Coût</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {maintenances.map(m => {
                                    const t = TYPES_MAINTENANCE[m.type];
                                    const enRetard = m.statut === 'PLANIFIE' && m.datePlanifie && new Date(m.datePlanifie) < new Date();
                                    return (
                                        <tr key={m.id} className={`transition-colors ${enRetard ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-700/30'}`}>
                                            <td className="px-6 py-4 text-white font-bold text-sm">{m.tricycle?.nom}</td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-slate-300 text-sm">
                                                    <span>{t?.emoji}</span>{t?.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate">{m.description}</td>
                                            <td className="px-6 py-4 text-right text-orange-400 font-bold text-sm">
                                                {m.cout > 0 ? `${m.cout.toLocaleString('fr-FR')} F` : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${m.statut === 'EFFECTUE'
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : enRetard
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                    }`}>
                                                    {m.statut === 'EFFECTUE' ? '✓ Effectuée' : enRetard ? '🚨 En retard' : '📅 Planifiée'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {m.dateEffectue
                                                    ? new Date(m.dateEffectue).toLocaleDateString('fr-FR')
                                                    : m.datePlanifie
                                                        ? `Prévu: ${new Date(m.datePlanifie).toLocaleDateString('fr-FR')}`
                                                        : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {m.statut === 'PLANIFIE' && (
                                                    <button onClick={() => handleValider(m.id)}
                                                        className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                                        ✓ Valider
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── Carburant ── */}
            {onglet === 'carburant' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {carburants.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">⛽</p>
                            <p>Aucun enregistrement carburant</p>
                            <button onClick={() => setModalCarburant(true)}
                                className="mt-4 text-yellow-400 text-sm font-bold">+ Premier plein</button>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Tricycle</th>
                                    <th className="px-6 py-4 text-center">Litres</th>
                                    <th className="px-6 py-4 text-center">Prix/L</th>
                                    <th className="px-6 py-4 text-right">Montant</th>
                                    <th className="px-6 py-4 text-center">Km</th>
                                    <th className="px-6 py-4 text-center">Tours</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {carburants.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-white font-bold text-sm">{c.tricycle?.nom}</td>
                                        <td className="px-6 py-4 text-center text-yellow-400 font-bold">{c.litres} L</td>
                                        <td className="px-6 py-4 text-center text-slate-400 text-sm">{c.prixLitre} F</td>
                                        <td className="px-6 py-4 text-right text-orange-400 font-black">{c.montantTotal.toLocaleString('fr-FR')} F</td>
                                        <td className="px-6 py-4 text-center text-slate-400 text-sm">{c.kilometrage || '—'}</td>
                                        <td className="px-6 py-4 text-center text-slate-400 text-sm">{c.nbTours || '—'}</td>
                                        <td className="px-6 py-4 text-slate-400 text-xs">
                                            {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-700 bg-slate-800/50">
                                <tr>
                                    <td className="px-6 py-3 text-slate-400 text-sm font-bold">Total</td>
                                    <td className="px-6 py-3 text-center text-yellow-400 font-black">
                                        {carburants.reduce((acc, c) => acc + c.litres, 0).toFixed(1)} L
                                    </td>
                                    <td />
                                    <td className="px-6 py-3 text-right text-orange-400 font-black">
                                        {carburants.reduce((acc, c) => acc + c.montantTotal, 0).toLocaleString('fr-FR')} F
                                    </td>
                                    <td colSpan="3" />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            )}

            {/* Modals */}
            {modalMaintenance && tricycles.length > 0 && (
                <ModalMaintenance tenantId={tenantId} tricycles={tricycles}
                    onSuccess={fetchData} onClose={() => setModalMaintenance(false)} />
            )}
            {modalCarburant && tricycles.length > 0 && (
                <ModalCarburant tenantId={tenantId} tricycles={tricycles}
                    onSuccess={fetchData} onClose={() => setModalCarburant(false)} />
            )}
        </div>
    );
}