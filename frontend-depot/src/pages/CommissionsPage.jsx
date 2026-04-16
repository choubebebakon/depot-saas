import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function CommissionsPage() {
    const { tenantId } = useAuth();
    const [commissions, setCommissions] = useState([]);
    const [calcul, setCalcul] = useState(null);
    const [stats, setStats] = useState(null);
    const [parametre, setParametre] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calculEnCours, setCalculEnCours] = useState(false);
    const [onglet, setOnglet] = useState('calcul');
    const [taux, setTaux] = useState('');
    const [periode, setPeriode] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [resC, resS, resP] = await Promise.all([
                api.get('/commissions', { params: { tenantId } }),
                api.get('/commissions/stats', { params: { tenantId } }),
                api.get('/commissions/parametre', { params: { tenantId } }),
            ]);
            setCommissions(Array.isArray(resC.data) ? resC.data : []);
            setStats(resS.data);
            setParametre(resP.data);
            if (resP.data) setTaux(resP.data.taux);
        } catch (err) {
            console.error('Erreur commissions:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveTaux = async () => {
        if (!taux) return;
        await api.post('/commissions/parametre', { taux: Number(taux), tenantId });
        fetchData();
    };

    const handleCalculer = async () => {
        setCalculEnCours(true);
        try {
            const res = await api.post('/commissions/calculer', { tenantId, periode });
            setCalcul(res.data);
            fetchData();
        } catch (err) {
            console.error('Erreur calcul:', err);
        } finally {
            setCalculEnCours(false);
        }
    };

    const handlePayer = async (id) => {
        await api.put(`/commissions/${id}/payer`, { tenantId });
        fetchData();
        if (calcul) handleCalculer();
    };

    const periodesDispos = commissions
        .map(c => c.periode)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort()
        .reverse();

    return (
        <div>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Commissions</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Calcul automatique des primes commerciaux sur les ventes
                    </p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Taux configuré</p>
                        <p className="text-white text-3xl font-black">{stats.taux}%</p>
                        <p className="text-slate-500 text-xs mt-1">sur le CA ventes</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">À Payer</p>
                        <p className="text-white text-3xl font-black">{(stats.totalAPayer || 0).toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></p>
                        <p className="text-slate-500 text-xs mt-1">{stats.nbAPayer} commission(s)</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                        <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Payées ce mois</p>
                        <p className="text-white text-3xl font-black">{(stats.totalPayesMois || 0).toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></p>
                    </div>
                </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-6">
                {[
                    ['calcul', '🧮 Calcul'],
                    ['historique', '📋 Historique'],
                    ['parametres', '⚙️ Paramètres'],
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

            {/* ── Onglet Calcul ── */}
            {onglet === 'calcul' && (
                <div className="space-y-6">
                    {!parametre ? (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
                            <p className="text-orange-400 font-black mb-2">⚙️ Aucun taux configuré</p>
                            <p className="text-slate-400 text-sm mb-4">Configurez un taux de commission avant de calculer.</p>
                            <button onClick={() => setOnglet('parametres')}
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
                                Configurer le taux →
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Sélection période + bouton calcul */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                                <p className="text-white font-bold mb-4">
                                    Taux actuel : <span className="text-indigo-400">{parametre.taux}%</span> sur le CA
                                </p>
                                <div className="flex gap-3 items-end flex-wrap">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                            Période à calculer
                                        </label>
                                        <input type="month" value={periode}
                                            onChange={e => setPeriode(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                                    </div>
                                    <button onClick={handleCalculer} disabled={calculEnCours}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                                        {calculEnCours ? '🔄 Calcul...' : '🧮 Calculer'}
                                    </button>
                                </div>
                            </div>

                            {/* Résultats calcul */}
                            {calcul && (
                                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-black">
                                                Résultats — {calcul.periode}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                Taux : {calcul.taux}% · Total : {calcul.totalCommissions.toLocaleString('fr-FR')} FCFA
                                            </p>
                                        </div>
                                    </div>

                                    {calcul.commissions.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <p className="text-3xl mb-2">🤷</p>
                                            <p>Aucune vente trouvée sur cette période</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                                    <th className="px-6 py-4">Commercial</th>
                                                    <th className="px-6 py-4">Rôle</th>
                                                    <th className="px-6 py-4 text-right">CA Ventes</th>
                                                    <th className="px-6 py-4 text-center">Nb Ventes</th>
                                                    <th className="px-6 py-4 text-center">Tournées</th>
                                                    <th className="px-6 py-4 text-right">Commission</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {calcul.commissions.map((c, i) => (
                                                    <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 font-black text-xs">
                                                                    {c.user.email[0].toUpperCase()}
                                                                </div>
                                                                <p className="text-white font-bold text-sm truncate max-w-[160px]">{c.user.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                                                                {c.user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-white font-bold">
                                                            {c.caVentes.toLocaleString('fr-FR')} FCFA
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-slate-400">{c.nbVentes}</td>
                                                        <td className="px-6 py-4 text-center text-slate-400">{c.nbTournees}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-indigo-400 font-black text-lg">
                                                                {c.montantCommission.toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {c.estPayee ? (
                                                                <span className="text-emerald-400 text-xs font-bold">✓ Payée</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        const comm = commissions.find(
                                                                            cm => cm.user.id === c.user.id && cm.periode === calcul.periode
                                                                        );
                                                                        if (comm) handlePayer(comm.id);
                                                                    }}
                                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                                                    💵 Payer
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-slate-700 bg-slate-800/50">
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-3 text-slate-400 font-bold text-sm">
                                                        Total commissions à verser
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-indigo-400 font-black text-lg">
                                                        {calcul.totalCommissions.toLocaleString('fr-FR')} FCFA
                                                    </td>
                                                    <td />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Historique ── */}
            {onglet === 'historique' && (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap mb-4">
                        {periodesDispos.map(p => (
                            <span key={p} className="bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl">
                                {p}
                            </span>
                        ))}
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                        {commissions.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                <p className="text-4xl mb-3">📋</p>
                                <p>Aucune commission calculée</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                        <th className="px-6 py-4">Commercial</th>
                                        <th className="px-6 py-4">Période</th>
                                        <th className="px-6 py-4">Taux</th>
                                        <th className="px-6 py-4 text-right">Montant</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {commissions.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-white font-bold text-sm">{c.user?.email}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{c.periode}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{c.tauxApplique}%</td>
                                            <td className="px-6 py-4 text-right text-indigo-400 font-black">
                                                {c.montant.toLocaleString('fr-FR')} FCFA
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${c.estPayee
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                    }`}>
                                                    {c.estPayee
                                                        ? `✓ Payée le ${new Date(c.datePaiement).toLocaleDateString('fr-FR')}`
                                                        : '⏳ À payer'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!c.estPayee && (
                                                    <button onClick={() => handlePayer(c.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                                        💵 Payer
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Paramètres ── */}
            {onglet === 'parametres' && (
                <div className="max-w-md">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-white font-black text-lg mb-2">⚙️ Taux de Commission</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Le taux est appliqué sur le chiffre d'affaires total de chaque commercial.
                            Un taux de 2% signifie que sur 1 000 000 FCFA de ventes, le commercial touche 20 000 FCFA.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                    Taux (%) *
                                </label>
                                <div className="flex gap-3">
                                    <input type="number" min="0" max="100" step="0.5"
                                        value={taux} onChange={e => setTaux(e.target.value)}
                                        placeholder="Ex: 2.5"
                                        className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 text-xl font-black text-center focus:outline-none focus:border-indigo-500" />
                                    <span className="text-slate-400 text-xl font-black flex items-center">%</span>
                                </div>
                            </div>

                            {/* Aperçu */}
                            {taux > 0 && (
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2 text-sm">
                                    <p className="text-indigo-400 font-bold">Aperçu :</p>
                                    {[500000, 1000000, 2000000].map(ca => (
                                        <div key={ca} className="flex justify-between text-slate-400">
                                            <span>CA {ca.toLocaleString('fr-FR')} FCFA</span>
                                            <span className="text-white font-bold">
                                                → {(ca * taux / 100).toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button onClick={handleSaveTaux} disabled={!taux}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
                                {parametre ? '✏️ Mettre à jour' : '⚙️ Configurer le taux'}
                            </button>
                        </div>
                    </div>

                    {parametre && (
                        <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm text-slate-400">
                            <p>Taux actuel : <strong className="text-indigo-400">{parametre.taux}%</strong></p>
                            {parametre.description && <p className="mt-1">{parametre.description}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}