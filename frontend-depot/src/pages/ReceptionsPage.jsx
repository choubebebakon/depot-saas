import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

export default function ReceptionsPage() {
    const { tenantId } = useAuth();
    const { depotId } = useDepot();
    const [fournisseurs, setFournisseurs] = useState([]);
    const [articles, setArticles] = useState([]);
    const [receptions, setReceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [fournisseurId, setFournisseurId] = useState('');
    const [numBordereau, setNumBordereau] = useState('');
    const [modePaiement, setModePaiement] = useState('CASH');
    const [montantPaye, setMontantPaye] = useState(0);
    const [lignes, setLignes] = useState([{ articleId: '', unite: 'BOUTEILLE', quantiteLivree: 0, quantiteGratuite: 0, prixAchatUnitaire: 0 }]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resF, resA, resR] = await Promise.all([
                api.get('/fournisseurs', { params: { tenantId } }),
                api.get('/articles', { params: { tenantId } }),
                api.get('/fournisseurs/receptions', { params: { tenantId, depotId } }),
            ]);
            setFournisseurs(resF.data || []);
            setArticles(resA.data || []);
            setReceptions(resR.data || []);
        } catch (err) {
            console.error('Erreur chargement données réception:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, depotId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const addLigne = () => {
        setLignes([...lignes, { articleId: '', unite: 'BOUTEILLE', quantiteLivree: 0, quantiteGratuite: 0, prixAchatUnitaire: 0 }]);
    };

    const removeLigne = (index) => {
        setLignes(lignes.filter((_, i) => i !== index));
    };

    const updateLigne = (index, field, value) => {
        const newLignes = [...lignes];
        newLignes[index][field] = value;
        setLignes(newLignes);
    };

    const calculateTotal = () => {
        return lignes.reduce((acc, l) => acc + (Number(l.quantiteLivree) * Number(l.prixAchatUnitaire)), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fournisseurId || !depotId) {
            setError('Veuillez sélectionner un fournisseur et un Dépôt actif.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await api.post('/fournisseurs/receptions', {
                tenantId,
                depotId,
                fournisseurId,
                numBordereau,
                modePaiement,
                montantPaye: Number(montantPaye),
                lignes: lignes.map(l => ({
                    ...l,
                    quantiteLivree: Number(l.quantiteLivree),
                    quantiteGratuite: Number(l.quantiteGratuite),
                    prixAchatUnitaire: Number(l.prixAchatUnitaire)
                }))
            });
            setIsFormOpen(false);
            fetchData();
            // Reset form
            setFournisseurId('');
            setNumBordereau('');
            setLignes([{ articleId: '', unite: 'BOUTEILLE', quantiteLivree: 0, quantiteGratuite: 0, prixAchatUnitaire: 0 }]);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de lâ€™enregistrement');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Réception Fournisseur</h1>
                    <p className="text-slate-400 text-sm mt-1">Gérez vos entrées de stock et bordereaux d'achat</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Nouveau Bordereau
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                    <div className="flex justify-between items-start mb-8">
                        <h2 className="text-xl font-black text-white">ðŸ“¦ Saisie Nouveau Bordereau</h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white transition-colors">Fermer</button>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-bold">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 block">Fournisseur</label>
                                <select 
                                    required 
                                    value={fournisseurId} 
                                    onChange={e => setFournisseurId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                >
                                    <option value="">Sélectionner fournisseur...</option>
                                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 block">NÂ° Bordereau</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: BR-2024-X"
                                    value={numBordereau}
                                    onChange={e => setNumBordereau(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 block">Mode Paiement</label>
                                <select 
                                    value={modePaiement} 
                                    onChange={e => setModePaiement(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                                >
                                    <option value="CASH">CASH</option>
                                    <option value="CREDIT">À Crédit</option>
                                    <option value="ORANGE_MONEY">Orange Money</option>
                                    <option value="MTN_MOMO">MTN MoMo</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-8 h-[1px] bg-slate-800" /> Articles Livrés
                            </h3>
                            {lignes.map((ligne, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                                    <div className="md:col-span-4">
                                        <label className="text-slate-600 text-[10px] font-black uppercase mb-1 block">Article</label>
                                        <select 
                                            required
                                            value={ligne.articleId}
                                            onChange={e => updateLigne(idx, 'articleId', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="">Choisir...</option>
                                            {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-slate-600 text-[10px] font-black uppercase mb-1 block">Unité</label>
                                        <select 
                                            value={ligne.unite}
                                            onChange={e => updateLigne(idx, 'unite', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="BOUTEILLE">Bouteille/Unité</option>
                                            <option value="CASIER">Casier</option>
                                            <option value="PACK">Pack</option>
                                            <option value="PLATEAU">Plateau</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-slate-600 text-[10px] font-black uppercase mb-1 block">Qté Livrée</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={ligne.quantiteLivree}
                                            onChange={e => updateLigne(idx, 'quantiteLivree', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-sm text-center font-bold"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-slate-600 text-[10px] font-black uppercase mb-1 block">Qté Gratuite</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={ligne.quantiteGratuite}
                                            onChange={e => updateLigne(idx, 'quantiteGratuite', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl px-3 py-2 text-sm text-center font-bold"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-slate-600 text-[10px] font-black uppercase mb-1 block">Prix Achat (Unité)</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={ligne.prixAchatUnitaire}
                                                onChange={e => updateLigne(idx, 'prixAchatUnitaire', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 text-indigo-400 rounded-xl px-3 py-2 text-sm text-center font-bold"
                                            />
                                        </div>
                                        {lignes.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeLigne(idx)}
                                                className="mb-1 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                âœ•
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addLigne}
                                className="w-full py-3 border border-dashed border-slate-700 rounded-2xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all text-sm font-bold uppercase tracking-widest"
                            >
                                + Ajouter une ligne
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-slate-800">
                            <div className="w-full md:w-64">
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 block">Montant Payé (FCFA)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={montantPaye}
                                    onChange={e => setMontantPaye(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl px-4 py-3 text-2xl font-black focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Général</p>
                                <p className="text-4xl font-black text-white">{calculateTotal().toLocaleString()} <span className="text-slate-500 text-lg">FCFA</span></p>
                                {calculateTotal() - montantPaye > 0 && (
                                    <p className="text-orange-500 text-sm font-bold mt-1 animate-pulse">
                                        Reste Ã  payer (Dette) : {(calculateTotal() - montantPaye).toLocaleString()} FCFA
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-8 py-4 bg-slate-900 text-slate-400 font-black rounded-2xl hover:bg-slate-800 transition-all"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {submitting ? 'Enregistrement...' : 'âœ… Valider la Réception'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/30">
                    <h2 className="text-lg font-black text-white">Historique Récents</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Fournisseur / Bordereau</th>
                                <th className="px-6 py-4">Articles</th>
                                <th className="px-6 py-4 text-right">Montant Total</th>
                                <th className="px-6 py-4 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 font-semibold text-sm">
                            {receptions.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-600">Aucune réception enregistrée</td></tr>
                            ) : receptions.map(r => (
                                <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-indigo-400 font-black">#{r.reference}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-white">{r.fournisseur?.nom}</p>
                                        <p className="text-slate-500 text-xs italic">{r.numBordereau || 'Sans NÂ° bordereau'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2">
                                            {r.lignes?.slice(0, 3).map((l, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] text-indigo-300" title={l.article?.designation}>
                                                    {l.article?.designation?.[0]}
                                                </div>
                                            ))}
                                            {r.lignes?.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-indigo-900 border-2 border-slate-950 flex items-center justify-center text-[10px] text-white">
                                                    +{r.lignes.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-white font-black">
                                        {(r.montantPaye + r.montantDette).toLocaleString()} FCFA
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {r.montantDette > 0 ? (
                                            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-lg text-xs">Partiel</span>
                                        ) : (
                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs">Soldé</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}




