import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { ROLES, hasRole } from '../utils/rbac';

function BadgeStatut({ statut }) {
    const config = {
        PAYE: { label: 'Paye', classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
        ATTENTE: { label: 'Attente', classes: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
        ANNULE: { label: 'Annule', classes: 'bg-red-500/10 border-red-500/30 text-red-400' },
    };
    const c = config[statut] || config.ATTENTE;
    return <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${c.classes}`}>{c.label}</span>;
}

function ModalDetailVente({ vente, tenantId, onSuccess, onClose, canCancel, canValidate }) {
    const [motifAnnulation, setMotifAnnulation] = useState('');
    const [showAnnulation, setShowAnnulation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    const handleAnnuler = async () => {
        if (!motifAnnulation.trim()) { setErreur('Motif obligatoire'); return; }
        setLoading(true);
        try {
            await api.patch(`/ventes/${vente.id}/annuler`, { motif: motifAnnulation, tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur annulation');
        } finally {
            setLoading(false);
        }
    };

    const handleValiderSortie = async () => {
        setLoading(true);
        setErreur('');
        try {
            await api.patch(`/ventes/${vente.id}/valider-sortie`, { tenantId });
            onSuccess();
            onClose();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur validation magasinier');
        } finally {
            setLoading(false);
        }
    };

    const handleImprimer = () => {
        const contenu = `
      <html><head><title>Facture ${vente.reference}</title>
      <style>
        body { font-family: Arial; padding: 20px; color: #111; }
        h1 { font-size: 20px; } h2 { font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
        th { background: #f4f4f4; }
        .total { font-size: 18px; font-weight: bold; margin-top: 12px; }
        .footer { margin-top: 30px; font-size: 11px; color: #888; }
      </style></head><body>
      <h1>Depot-SaaS - Facture</h1>
      <p><strong>Reference :</strong> ${vente.reference}</p>
      <p><strong>Date :</strong> ${new Date(vente.date).toLocaleDateString('fr-FR')}</p>
      <p><strong>Site :</strong> ${vente.site?.nom || '-'}</p>
      ${vente.client ? `<p><strong>Client :</strong> ${vente.client.nom}</p>` : ''}
      ${vente.createur ? `<p><strong>Cree par :</strong> ${vente.createur.email}</p>` : ''}
      <h2>Detail de la vente</h2>
      <table>
        <tr><th>Article</th><th>Qte</th><th>Prix U.</th><th>Remise</th><th>Total</th></tr>
        ${vente.lignes.map(l => `
          <tr>
            <td>${l.article?.designation}</td>
            <td>${l.quantite}</td>
            <td>${l.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
            <td>${(l.remise || 0).toLocaleString('fr-FR')} FCFA</td>
            <td>${l.total.toLocaleString('fr-FR')} FCFA</td>
          </tr>
        `).join('')}
      </table>
      <p class="total">TOTAL : ${vente.total.toLocaleString('fr-FR')} FCFA</p>
      <p>Mode de paiement : ${vente.modePaiement || 'CASH'}</p>
      <p>Statut : ${vente.statut}</p>
      <p class="footer">Genere par Depot-SaaS - ${new Date().toLocaleDateString('fr-FR')}</p>
      </body></html>
    `;
        const w = window.open('', '_blank');
        w.document.write(contenu);
        w.document.close();
        w.print();
    };

    const totalRemise = vente.lignes.reduce((acc, l) => acc + (l.remise || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-3xl shadow-2xl my-4">
                <div className="flex justify-between items-start mb-6 gap-4">
                    <div>
                        <h3 className="text-white font-black text-xl">{vente.reference}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {new Date(vente.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        {vente.createur && (
                            <p className="text-xs text-slate-500 mt-1">Créée par {vente.createur.email}</p>
                        )}
                    </div>
                    <BadgeStatut statut={vente.statut} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                    <div className="bg-slate-800 rounded-xl p-3">
                        <p className="text-slate-500 text-xs mb-1">Site</p>
                        <p className="text-white font-bold">{vente.site?.nom || '—'}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3">
                        <p className="text-slate-500 text-xs mb-1">Mode paiement</p>
                        <p className="text-white font-bold">{vente.modePaiement || 'CASH'}</p>
                    </div>
                    {vente.client && (
                        <div className="bg-slate-800 rounded-xl p-3 col-span-2">
                            <p className="text-slate-500 text-xs mb-1">Client</p>
                            <p className="text-white font-bold">{vente.client.nom}</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-800 rounded-xl overflow-hidden mb-5">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
                                <th className="px-4 py-3 text-left">Article</th>
                                <th className="px-4 py-3 text-center">Qte</th>
                                <th className="px-4 py-3 text-right">Prix U.</th>
                                <th className="px-4 py-3 text-right">Remise</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {vente.lignes.map((l) => (
                                <tr key={l.id}>
                                    <td className="px-4 py-3 text-white font-semibold">{l.article?.designation}</td>
                                    <td className="px-4 py-3 text-center text-slate-400">{l.quantite}</td>
                                    <td className="px-4 py-3 text-right text-slate-400">{l.prixUnitaire.toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3 text-right text-amber-400">{(l.remise || 0).toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3 text-right text-white font-bold">{l.total.toLocaleString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-slate-700 bg-slate-900/50">
                            {totalRemise > 0 && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-2 text-right text-amber-400 font-bold">Remises</td>
                                    <td className="px-4 py-2 text-right text-amber-400 font-bold">
                                        -{totalRemise.toLocaleString('fr-FR')} FCFA
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan="4" className="px-4 py-3 text-white font-black text-right">TOTAL</td>
                                <td className="px-4 py-3 text-right text-indigo-400 font-black text-lg">
                                    {vente.total.toLocaleString('fr-FR')} FCFA
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {vente.statut === 'ANNULE' && vente.motifAnnulation && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400">
                        <strong>Motif annulation :</strong> {vente.motifAnnulation}
                    </div>
                )}

                {vente.statut === 'ATTENTE' && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4 text-sm text-orange-300">
                        Sortie physique non encore validée. La vente reste en attente tant que le magasinier ne confirme pas.
                    </div>
                )}

                {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}

                {vente.statut !== 'ANNULE' && showAnnulation && canCancel && (
                    <div className="mb-4 space-y-3">
                        <input value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)}
                            placeholder="Motif obligatoire"
                            className="w-full bg-slate-800 border border-red-500/40 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowAnnulation(false)}
                                className="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-sm">
                                Annuler
                            </button>
                            <button onClick={handleAnnuler} disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition-all">
                                {loading ? '...' : 'Confirmer annulation'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <button onClick={onClose}
                        className="flex-1 min-w-[140px] bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm">
                        Fermer
                    </button>
                    <button onClick={handleImprimer}
                        className="flex-1 min-w-[160px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all">
                        Imprimer PDF
                    </button>
                    {canValidate && vente.statut === 'ATTENTE' && (
                        <button onClick={handleValiderSortie} disabled={loading}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold py-3 px-4 rounded-xl text-sm transition-all">
                            Valider sortie
                        </button>
                    )}
                    {canCancel && vente.statut !== 'ANNULE' && !showAnnulation && (
                        <button onClick={() => setShowAnnulation(true)}
                            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold py-3 px-4 rounded-xl text-sm transition-all">
                            Annuler
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PendingValidationPanel({ ventes, onRefresh, tenantId, canValidate }) {
    const [processingId, setProcessingId] = useState('');
    const [error, setError] = useState('');

    const handleValidate = async (venteId) => {
        setProcessingId(venteId);
        setError('');
        try {
            await api.patch(`/ventes/${venteId}/valider-sortie`, { tenantId });
            onRefresh();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de validation.');
        } finally {
            setProcessingId('');
        }
    };

    if (!canValidate) return null;

    return (
        <div className="mb-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-white font-black text-lg">Sorties en attente</h2>
                    <p className="text-orange-300 text-sm mt-1">Le magasinier valide ici les sorties physiques liées aux ventes.</p>
                </div>
                <div className="rounded-xl bg-orange-500/10 px-3 py-2 text-orange-400 font-black text-sm">
                    {ventes.length} attente{ventes.length > 1 ? 's' : ''}
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {ventes.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-6 text-sm text-slate-500">
                    Aucune sortie à valider.
                </div>
            ) : (
                <div className="space-y-3">
                    {ventes.map((vente) => (
                        <div key={vente.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-indigo-400 font-black">{vente.reference}</span>
                                        <BadgeStatut statut={vente.statut} />
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {vente.client?.nom || 'Vente comptoir'} · {vente.total.toLocaleString('fr-FR')} FCFA
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        {vente.createur?.email || 'Utilisateur inconnu'} · {new Date(vente.date).toLocaleString('fr-FR')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleValidate(vente.id)}
                                    disabled={processingId === vente.id}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-black text-white transition-all"
                                >
                                    {processingId === vente.id ? 'Validation...' : 'Confirmer la sortie'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function VentesPage() {
    const { tenantId, role } = useAuth();
    const { siteId } = useSite();
    const canValidate = hasRole(role, [ROLES.PATRON, ROLES.GERANT, ROLES.MAGASINIER]);
    const canCancel = hasRole(role, [ROLES.PATRON, ROLES.GERANT, ROLES.CAISSIER]);
    const [ventes, setVentes] = useState([]);
    const [ventesEnAttente, setVentesEnAttente] = useState([]);
    const [loading, setLoading] = useState(true);
    const [venteDetail, setVenteDetail] = useState(null);
    const [filtres, setFiltres] = useState({
        startDate: '',
        endDate: '',
        statut: '',
        recherche: '',
    });

    const fetchVentes = useCallback(async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const params = { tenantId, ...(siteId ? { siteId } : {}) };
            if (filtres.startDate) params.startDate = filtres.startDate;
            if (filtres.endDate) params.endDate = filtres.endDate;
            if (filtres.statut) params.statut = filtres.statut;

            const [resVentes, resAttente] = await Promise.all([
                api.get('/ventes', { params }),
                canValidate
                    ? api.get('/ventes/validations/en-attente', { params: { tenantId, ...(siteId ? { siteId } : {}) } })
                    : Promise.resolve({ data: [] }),
            ]);

            setVentes(Array.isArray(resVentes.data) ? resVentes.data : []);
            setVentesEnAttente(Array.isArray(resAttente.data) ? resAttente.data : []);
        } catch (err) {
            console.error('Erreur ventes:', err);
        } finally {
            setLoading(false);
        }
    }, [tenantId, siteId, filtres, canValidate]);

    useEffect(() => { fetchVentes(); }, [fetchVentes]);

    useEffect(() => {
        const handler = () => fetchVentes();
        window.addEventListener('refresh-ventes', handler);
        return () => window.removeEventListener('refresh-ventes', handler);
    }, [fetchVentes]);

    const ventesFiltrees = ventes.filter((v) => {
        if (!filtres.recherche) return true;
        const r = filtres.recherche.toLowerCase();
        return v.reference.toLowerCase().includes(r) ||
            v.client?.nom?.toLowerCase().includes(r) ||
            v.createur?.email?.toLowerCase().includes(r);
    });

    const totalCA = ventesFiltrees
        .filter((v) => v.statut === 'PAYE')
        .reduce((acc, v) => acc + v.total, 0);

    const nbAnnulees = ventesFiltrees.filter((v) => v.statut === 'ANNULE').length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white">Historique des ventes</h1>
                    <p className="text-slate-400 text-sm mt-1">Suivi des ventes, validation magasinier et journal des actions sensibles.</p>
                </div>
            </div>

            <PendingValidationPanel
                ventes={ventesEnAttente}
                tenantId={tenantId}
                onRefresh={fetchVentes}
                canValidate={canValidate}
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Total ventes</p>
                    <p className="text-white text-3xl font-black">{ventesFiltrees.length}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">CA validé</p>
                    <p className="text-white text-3xl font-black">{totalCA.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                    <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">En attente</p>
                    <p className="text-white text-3xl font-black">{ventesFiltrees.filter((v) => v.statut === 'ATTENTE').length}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Annulées</p>
                    <p className="text-white text-3xl font-black">{nbAnnulees}</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Filtres</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="text-slate-500 text-xs mb-1 block">Date début</label>
                        <input type="date" value={filtres.startDate}
                            onChange={(e) => setFiltres({ ...filtres, startDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs mb-1 block">Date fin</label>
                        <input type="date" value={filtres.endDate}
                            onChange={(e) => setFiltres({ ...filtres, endDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs mb-1 block">Statut</label>
                        <select value={filtres.statut}
                            onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Tous</option>
                            <option value="ATTENTE">En attente</option>
                            <option value="PAYE">Payé</option>
                            <option value="ANNULE">Annulé</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs mb-1 block">Référence / Client / Créateur</label>
                        <input value={filtres.recherche}
                            onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
                            placeholder="FAC-2026-..."
                            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                </div>
                <div className="flex justify-end mt-3">
                    <button onClick={() => setFiltres({ startDate: '', endDate: '', statut: '', recherche: '' })}
                        className="text-slate-400 hover:text-white text-xs font-bold transition-colors">
                        Réinitialiser filtres
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : ventesFiltrees.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <p className="font-semibold">Aucune vente trouvée</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Site</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Créateur</th>
                                <th className="px-6 py-4">Paiement</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {ventesFiltrees.map((v) => (
                                <tr key={v.id}
                                    className={`hover:bg-slate-700/30 transition-colors ${v.statut === 'ANNULE' ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 text-indigo-400 font-black text-sm">{v.reference}</td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {new Date(v.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 text-sm">{v.site?.nom || '—'}</td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{v.client?.nom || '—'}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{v.createur?.email || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-lg">
                                            {v.modePaiement || 'CASH'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-black text-sm ${v.statut === 'ANNULE' ? 'line-through text-slate-500' : 'text-white'}`}>
                                        {v.total.toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-6 py-4"><BadgeStatut statut={v.statut} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setVenteDetail(v)}
                                            className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all">
                                            Détail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {venteDetail && (
                <ModalDetailVente
                    vente={venteDetail}
                    tenantId={tenantId}
                    onSuccess={fetchVentes}
                    onClose={() => setVenteDetail(null)}
                    canCancel={canCancel}
                    canValidate={canValidate}
                />
            )}
        </div>
    );
}
