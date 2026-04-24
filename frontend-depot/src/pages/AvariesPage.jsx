import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';

export default function AvariesPage() {
    const { tenantId } = useAuth();
    const { depotId } = useDepot();
    const [articles, setArticles] = useState([]);
    const [mouvements, setMouvements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [articleId, setArticleId] = useState('');
    const [quantite, setQuantite] = useState(1);
    const [motif, setMotif] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resA, resM] = await Promise.all([
                api.get('/articles', { params: { tenantId } }),
                api.get('/stocks/mouvements', { params: { tenantId, depotId, type: 'CASSE_AVARIE' } }),
            ]);
            setArticles(resA.data || []);
            // Filtrer uniquement les avaries si l'API ne le fait pas déjÃ 
            const logs = (resM.data || []).filter(m => m.type === 'CASSE_AVARIE');
            setMouvements(logs);
        } catch (err) {
            console.error('Erreur données avaries:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, depotId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/stocks/avarie', {
                articleId,
                depotId,
                quantite: Number(quantite),
                motif,
                photoUrl, // Simulation
                tenantId
            });
            setSuccess('Avarie signalée avec succès. Le stock a été mis Ã  jour.');
            setArticleId('');
            setQuantite(1);
            setMotif('');
            setPhotoUrl('');
            fetchData();
            window.dispatchEvent(new CustomEvent('refresh-stocks'));
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du signalement');
        } finally {
            setSubmitting(false);
        }
    };

    // Simulation d'upload photo
    const handlePhotoSim = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Simulation : on crée un object URL local
            setPhotoUrl(URL.createObjectURL(file));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Gestion des Pertes & Avaries</h1>
                <p className="text-slate-400 text-sm mt-1">Signalez les produits cassés, perçés ou périmés pour corriger le stock</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Formulaire de signalement */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                        
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="p-2 bg-red-500/10 rounded-xl text-red-500">âš ï¸</span>
                            Signaler une perte
                        </h2>

                        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold font-mono">{error}</div>}
                        {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold font-mono">âœ“ {success}</div>}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">Article endommagé</label>
                                <select 
                                    required
                                    value={articleId}
                                    onChange={e => setArticleId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-all font-semibold"
                                >
                                    <option value="">Sélectionner l'article...</option>
                                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">Quantité (Unités)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required
                                        value={quantite}
                                        onChange={e => setQuantite(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-all font-black text-center text-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">État / Motif</label>
                                    <select 
                                        required
                                        value={motif}
                                        onChange={e => setMotif(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 transition-all font-semibold"
                                    >
                                        <option value="">Choisir état...</option>
                                        <option value="Cassé / Brisé">Cassé / Brisé</option>
                                        <option value="Percé / Fuite">Percé / Fuite</option>
                                        <option value="Périmé">Périmé (DLC)</option>
                                        <option value="Vol / Manquant">Vol / Manquant</option>
                                        <option value="Erreur saisie">Erreur saisie</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 block">Preuve Photo (Simulation)</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handlePhotoSim}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full h-40 border-2 border-dashed ${photoUrl ? 'border-emerald-500/50' : 'border-slate-800 group-hover:border-slate-700'} rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-900/50 overflow-hidden`}>
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <span className="text-2xl mb-2">ðŸ“¸</span>
                                                <span className="text-slate-500 text-[10px] font-black uppercase">Cliquez pour ajouter une photo</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {submitting ? '...' : 'ðŸ“‰ Soustraire du Stock'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Historique des logs de perte */}
                <div className="lg:col-span-12 xl:col-span-7">
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
                        <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
                            <h2 className="text-lg font-black text-white">Log des Dernières Pertes</h2>
                            <div className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full border border-red-500/20 uppercase tracking-widest">Audit Trail</div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-12 text-center text-slate-600">Chargement...</div>
                            ) : mouvements.length === 0 ? (
                                <div className="p-12 text-center text-slate-700">
                                    <p className="text-5xl mb-4">ðŸ›¡ï¸</p>
                                    <p className="font-bold">Aucune perte signalée récemment</p>
                                    <p className="text-xs text-slate-600 mt-1">Le stock est actuellement propre</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {mouvements.map(m => (
                                        <div key={m.id} className="p-6 hover:bg-slate-900/50 transition-colors flex gap-6 items-start">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                                                {m.photoUrl ? (
                                                    <img src={m.photoUrl} alt="Preuve" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-slate-700 text-xl font-black">{m.article?.designation?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-white font-bold text-sm truncate">{m.article?.designation}</h3>
                                                    <span className="text-red-400 font-black text-sm">-{m.quantite}</span>
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1 font-semibold">{m.motif || 'Aucun motif'}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">
                                                        {new Date(m.createdAt).toLocaleDateString('fr-FR')} Ã  {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                    <span className="text-[10px] text-slate-500 italic">Dépôt: {m.Dépôt?.nom || depotId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




