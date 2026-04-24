import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { generateId } from '../utils/offline';

// â”€â”€ Catégories de dépenses prédéfinies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES_DEPENSES = [
    'Carburant', 'Salaire', 'Loyer', 'Électricité', 'Eau',
    'Transport', 'Maintenance', 'Achat divers', 'Remboursement vides', 'Autre',
];

// â”€â”€ Modal Ouverture Caisse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalOuvrirCaisse({ tenantId, depotId, userId, onSuccess, onClose }) {
    const [fondInitial, setFondInitial] = useState(0);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/caisse/ouvrir', { fondInitial: Number(fondInitial), depotId, userId, tenantId });
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
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-black text-xl mb-2">ðŸ’° Ouvrir la Caisse</h3>
                <p className="text-slate-400 text-sm mb-6">Saisissez le fond de départ en FCFA</p>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="number" min="0" required
                        value={fondInitial}
                        onChange={e => setFondInitial(e.target.value)}
                        placeholder="Ex: 50000"
                        className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-4 text-2xl font-black text-center focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-slate-500 text-xs text-center">FCFA de fond de caisse</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[10000, 25000, 50000].map(v => (
                            <button key={v} type="button" onClick={() => setFondInitial(v)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-all">
                                {v.toLocaleString()} F
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : 'âœ… Ouvrir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Fermeture Caisse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalFermerCaisse({ session, soldeTheorique, onSuccess, onClose }) {
    const [fondFinal, setFondFinal] = useState('');
    const [motifEcart, setMotifEcart] = useState('');
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const ecart = fondFinal !== '' ? Number(fondFinal) - soldeTheorique : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (ecart !== 0 && !motifEcart) {
            setErreur('Motif obligatoire en cas d\'écart.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/caisse/fermer', {
                sessionId: session.id,
                fondFinal: Number(fondFinal),
                motifEcart,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur fermeture');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">ðŸ”’ Clôture de Caisse</h3>
                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                <div className="bg-slate-800 rounded-xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Fond initial</span>
                        <span className="text-white font-bold">{session.fondInitial.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Solde théorique</span>
                        <span className="text-indigo-400 font-bold">{soldeTheorique.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {ecart !== null && (
                        <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                            <span className="text-slate-400">Écart constaté</span>
                            <span className={`font-black ${ecart > 0 ? 'text-emerald-400' : ecart < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                            Cash compté dans la caisse (FCFA) *
                        </label>
                        <input
                            type="number" min="0" required
                            value={fondFinal}
                            onChange={e => setFondFinal(e.target.value)}
                            placeholder="Comptez physiquement..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-xl font-black text-center focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {ecart !== null && ecart !== 0 && (
                        <div>
                            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                Motif de l'écart * (obligatoire)
                            </label>
                            <input
                                required
                                value={motifEcart}
                                onChange={e => setMotifEcart(e.target.value)}
                                placeholder="Ex: Erreur de rendu monnaie..."
                                className="w-full bg-slate-800 border border-red-500/40 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={loading || fondFinal === ''}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {loading ? '...' : 'ðŸ”’ Clôturer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Modal Nouvelle Dépense â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalDepense({ tenantId, depotId, onSuccess, onClose }) {
    const [form, setForm] = useState({ categorie: '', montant: '', motif: '' });
    const queryClient = useQueryClient();
    const { addToQueue } = useOfflineSync();

    const createDepenseMutation = useMutation({
        mutationFn: async (payload) => {
            if (!navigator.onLine) {
                await addToQueue('POST', '/caisse/depenses', payload);
                return { ...payload, status: 'QUEUED_OFFLINE' };
            }
            const res = await api.post('/caisse/depenses', payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['caisse-resume', tenantId, depotId]);
            queryClient.invalidateQueries(['depenses', tenantId, depotId]);
            onSuccess();
            onClose();
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            id: generateId(),
            ...form,
            montant: Number(form.montant),
            tenantId,
            depotId
        };
        createDepenseMutation.mutate(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-black text-xl mb-6">ðŸ’¸ Nouvelle Dépense</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catégorie *</label>
                        <select required value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Choisir une catégorie...</option>
                            {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (FCFA) *</label>
                        <input type="number" min="1" required
                            value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })}
                            placeholder="Ex: 5000"
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Motif *</label>
                        <input required value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                            placeholder="Ex: Plein carburant tricycle Alpha..."
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
                        <button type="submit" disabled={createDepenseMutation.isLoading}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                            {createDepenseMutation.isLoading ? '...' : 'ðŸ’¸ Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// â”€â”€ Page Principale Caisse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CaissePage() {
    const { tenantId, user } = useAuth();
    const { depotId, DépôtActif } = useDepot();
    const queryClient = useQueryClient();
    const [onglet, setOnglet] = useState('resume');
    const [modalOuvrir, setModalOuvrir] = useState(false);
    const [modalFermer, setModalFermer] = useState(false);
    const [modalDepense, setModalDepense] = useState(false);

    const { data: resume, isLoading: loadingResume } = useQuery({
        queryKey: ['caisse-resume', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/caisse/resume', { params: { tenantId, depotId } });
            return res.data;
        },
        enabled: !!tenantId && !!depotId
    });

    const { data: depenses = [], isLoading: loadingDepenses } = useQuery({
        queryKey: ['depenses', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/caisse/depenses', { params: { tenantId, depotId } });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId && !!depotId
    });

    const { data: historique = [], isLoading: loadingHistorique } = useQuery({
        queryKey: ['caisse-historique', tenantId, depotId],
        queryFn: async () => {
            const res = await api.get('/caisse/historique', { params: { tenantId, depotId } });
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!tenantId && !!depotId
    });

    const loading = loadingResume || (onglet === 'depenses' && loadingDepenses) || (onglet === 'historique' && loadingHistorique);

    const refreshData = () => {
        queryClient.invalidateQueries(['caisse-resume', tenantId, depotId]);
        queryClient.invalidateQueries(['depenses', tenantId, depotId]);
        queryClient.invalidateQueries(['caisse-historique', tenantId, depotId]);
    };

    if (!depotId) return (
        <div className="flex items-center justify-center h-64 text-slate-400">
            Sélectionnez un Dépôt pour accéder Ã  la caisse.
        </div>
    );

    const soldeTheorique = resume ? resume.fondInitial + resume.ventesCash - resume.depensesTotal : 0;

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Caisse â€” {DépôtActif?.nom}</h1>
                    <p className="text-slate-400 text-sm mt-1">Session journalière & dépenses opérationnelles</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {resume?.sessionActive ? (
                        <>
                            <button onClick={() => setModalDepense(true)}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
                                ðŸ’¸ Dépense
                            </button>
                            <button onClick={() => setModalFermer(true)}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
                                ðŸ”’ Clôturer
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setModalOuvrir(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                            ðŸ’° Ouvrir la Caisse
                        </button>
                    )}
                </div>
            </div>

            {/* Statut session */}
            <div className={`rounded-2xl p-4 mb-8 flex items-center gap-3 border ${resume?.sessionActive
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                <div className={`w-3 h-3 rounded-full ${resume?.sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className={`font-bold text-sm ${resume?.sessionActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {resume?.sessionActive ? 'âœ… Caisse OUVERTE â€” Session en cours' : 'â¸ï¸ Caisse FERMÉE â€” Aucune session active'}
                </span>
            </div>

            {/* Cartes résumé */}
            {loadingResume ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800 rounded-2xl" />)}
                </div>
            ) : resume && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Ventes Cash', valeur: resume.ventesCash, couleur: 'emerald', emoji: 'ðŸ’µ' },
                        { label: 'Orange Money', valeur: resume.ventesOM, couleur: 'orange', emoji: 'ðŸ“±' },
                        { label: 'MTN MoMo', valeur: resume.ventesMoMo, couleur: 'yellow', emoji: 'ðŸ“²' },
                        { label: 'Dépenses', valeur: resume.depensesTotal, couleur: 'red', emoji: 'ðŸ’¸' },
                    ].map((c, i) => (
                        <div key={i} className={`bg-${c.couleur}-500/10 border border-${c.couleur}-500/20 rounded-2xl p-4`}>
                            <p className={`text-${c.couleur}-400 text-xs font-bold uppercase tracking-widest mb-2`}>{c.label}</p>
                            <p className="text-white text-2xl font-black">{c.valeur.toLocaleString('fr-FR')}</p>
                            <p className="text-slate-500 text-xs mt-1">FCFA</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Solde net */}
            {resume && (
                <div className={`rounded-2xl p-5 mb-8 flex justify-between items-center border ${resume.soldeNet >= 0
                        ? 'bg-indigo-500/10 border-indigo-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    <span className="text-slate-300 font-bold">Solde Net Cash (Ventes Cash âˆ’ Dépenses)</span>
                    <span className={`text-3xl font-black ${resume.soldeNet >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                        {resume.soldeNet >= 0 ? '+' : ''}{resume.soldeNet.toLocaleString('fr-FR')} FCFA
                    </span>
                </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                {[['resume', 'ðŸ“Š Résumé'], ['depenses', 'ðŸ’¸ Dépenses'], ['historique', 'ðŸ“‹ Historique']].map(([id, label]) => (
                    <button key={id} onClick={() => setOnglet(id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${onglet === id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Contenu onglet Dépenses */}
            {onglet === 'depenses' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {loadingDepenses ? (
                         <div className="flex items-center justify-center h-48 animate-pulse text-slate-500 text-sm">Chargement des dépenses...</div>
                    ) : depenses.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">ðŸ’¸</p>
                            <p className="font-semibold">Aucune dépense aujourd'hui</p>
                            {resume?.sessionActive && (
                                <button onClick={() => setModalDepense(true)}
                                    className="mt-4 text-red-400 text-sm font-bold">+ Enregistrer une dépense</button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Catégorie</th>
                                    <th className="px-6 py-4">Motif</th>
                                    <th className="px-6 py-4 text-right">Montant</th>
                                    <th className="px-6 py-4">Heure</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {depenses.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-lg">
                                                {d.categorie}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 text-sm">{d.motif}</td>
                                        <td className="px-6 py-4 text-right text-red-400 font-black">
                                            -{d.montant.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(d.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-700 bg-slate-800/50">
                                <tr>
                                    <td colSpan="2" className="px-6 py-3 text-slate-400 text-sm font-bold">Total dépenses</td>
                                    <td className="px-6 py-3 text-right text-red-400 font-black">
                                        -{depenses.reduce((acc, d) => acc + d.montant, 0).toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            )}

            {/* Historique sessions */}
            {onglet === 'historique' && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    {loadingHistorique ? (
                         <div className="flex items-center justify-center h-48 animate-pulse text-slate-500 text-sm">Chargement de l'historique...</div>
                    ) : historique.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-4xl mb-3">ðŸ“‹</p>
                            <p>Aucune session passée</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">Date ouverture</th>
                                    <th className="px-6 py-4">Caissier</th>
                                    <th className="px-6 py-4">Fond initial</th>
                                    <th className="px-6 py-4">Fond final</th>
                                    <th className="px-6 py-4">Écart</th>
                                    <th className="px-6 py-4">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {historique.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300 text-sm">
                                            {new Date(s.dateOuverture).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{s.user?.email}</td>
                                        <td className="px-6 py-4 text-slate-300 font-bold text-sm">
                                            {s.fondInitial.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 font-bold text-sm">
                                            {s.fondFinal != null ? `${s.fondFinal.toLocaleString('fr-FR')} FCFA` : 'â€”'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {s.ecart != null ? (
                                                <span className={`font-black ${s.ecart > 0 ? 'text-emerald-400' : s.ecart < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {s.ecart > 0 ? '+' : ''}{s.ecart.toLocaleString('fr-FR')} FCFA
                                                </span>
                                            ) : 'â€”'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${s.estOuverte
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-slate-700 border-slate-600 text-slate-400'
                                                }`}>
                                                {s.estOuverte ? 'â— Ouverte' : 'âœ“ Clôturée'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Résumé onglet */}
            {onglet === 'resume' && resume && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4">ðŸ“Š Ventilation des encaissements</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Ventes Cash', val: resume.ventesCash, couleur: 'emerald' },
                                { label: 'Orange Money', val: resume.ventesOM, couleur: 'orange' },
                                { label: 'MTN MoMo', val: resume.ventesMoMo, couleur: 'yellow' },
                                { label: 'Crédit (Ardoise)', val: resume.ventesCredit, couleur: 'red' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700">
                                    <span className="text-slate-400 text-sm">{item.label}</span>
                                    <span className={`text-${item.couleur}-400 font-bold text-sm`}>
                                        {item.val.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-white font-bold">Total ventes</span>
                                <span className="text-white font-black">{resume.ventesTotal.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4">ðŸ§¾ Résumé de la journée</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Nombre de ventes</span>
                                <span className="text-white font-bold">{resume.nbVentes}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Nombre de dépenses</span>
                                <span className="text-white font-bold">{resume.nbDepenses}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Total dépenses</span>
                                <span className="text-red-400 font-bold">-{resume.depensesTotal.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-white font-black">Solde net cash</span>
                                <span className={`font-black text-lg ${resume.soldeNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {resume.soldeNet >= 0 ? '+' : ''}{resume.soldeNet.toLocaleString('fr-FR')} FCFA
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {modalOuvrir && (
                <ModalOuvrirCaisse
                    tenantId={tenantId} depotId={depotId} userId={user?.id}
                    onSuccess={refreshData} onClose={() => setModalOuvrir(false)}
                />
            )}
            {modalFermer && resume?.sessionId && (
                <ModalFermerCaisse
                    session={{ id: resume.sessionId, fondInitial: resume.fondInitial }}
                    soldeTheorique={soldeTheorique}
                    onSuccess={refreshData} onClose={() => setModalFermer(false)}
                />
            )}
            {modalDepense && (
                <ModalDepense
                    tenantId={tenantId} depotId={depotId}
                    onSuccess={refreshData} onClose={() => setModalDepense(false)}
                />
            )}
        </div>
    );
}




