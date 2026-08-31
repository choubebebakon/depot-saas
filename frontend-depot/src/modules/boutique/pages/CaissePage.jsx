import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import api from '../../../api/axios';
import VenteBoutiqueForm from '../forms/VenteBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { Unlock, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

function OuvrirCaisseModal({ isOpen, onClose, onOpen }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { montant: '', motif: '' } });
  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onOpen)} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Unlock className="w-5 h-5" /> Ouverture de caisse</h2>
        <div className="space-y-4"><div><input type="number" placeholder="Montant initial (FCFA) *" {...register('montant', { required: 'Montant requis', min: { value: 0, message: 'Le montant doit être positif' } })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" />{errors.montant && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errors.montant.message}</p>}</div><div><input placeholder="Motif d'ouverture (optionnel)" {...register('motif')} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" /></div></div>
        <div className="flex gap-3 mt-6"><button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button><button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Ouvrir</button></div>
      </form>
    </div>
  ) : null;
}

function MouvementCaisseModal({ isOpen, onClose, onSubmit }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: { montant: '', motif: '', typeMouvement: 'ENTREE' } });
  const typeMouvement = watch('typeMouvement');
  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"><h2 className="text-lg font-black text-white mb-4">Nouveau mouvement</h2><div className="space-y-4"><div className="flex gap-3"><button type="button" onClick={() => setValue('typeMouvement', 'ENTREE')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${typeMouvement === 'ENTREE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ArrowDownToLine className="w-4 h-4 mx-auto" /> Entrée</button><button type="button" onClick={() => setValue('typeMouvement', 'SORTIE')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${typeMouvement === 'SORTIE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ArrowUpFromLine className="w-4 h-4 mx-auto" /> Sortie</button></div><div><input type="number" placeholder="Montant (FCFA) *" {...register('montant', { required: 'Montant requis', min: { value: 0, message: 'Le montant doit être positif' } })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" />{errors.montant && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errors.montant.message}</p>}</div><div><input placeholder="Motif *" {...register('motif', { required: 'Motif requis' })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500" />{errors.motif && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {errors.motif.message}</p>}</div></div><div className="flex gap-3 mt-6"><button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button><button type="submit" className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Valider</button></div></form></div>
  ) : null;
}

export default function CaissePage() {
  const depotData = useDepot();
  const depotActif = depotData?.depotActif;
  const perm = usePermission(PERMISSIONS, 'caisse');
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [showModal, setShowModal] = useState(null);
  const [confirmFermer, setConfirmFermer] = useState(null);
  const [rapportData, setRapportData] = useState(null);
  const [fetchingRapport, setFetchingRapport] = useState(false);
  const currentDepotId = depotActif?.id;
  const caisseQueryKey = ['boutique-caisse-statut', currentDepotId];

  const { data: caisse, isLoading, error: queryError } = useQuery({
    queryKey: caisseQueryKey,
    queryFn: async () => {
      const res = await api.get('/boutique/caisse/statut', { params: { depotId: currentDepotId } });
      return res.data;
    },
    refetchInterval: 10_000,
    enabled: !!currentDepotId
  });

  const ouvrirMutation = useMutation({
    mutationFn: (data) => api.post('/boutique/caisse/ouvrir', { montantInitial: parseInt(data.montant, 10), motif: data.motif, depotId: currentDepotId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: caisseQueryKey }); notif.success('Caisse ouverte avec succès'); setShowModal(null); },
    onError: (err) => notif.error(err.response?.data?.message || "Erreur lors de l'ouverture")
  });

  const fermerMutation = useMutation({
    mutationFn: () => api.post('/boutique/caisse/fermer', { depotId: currentDepotId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: caisseQueryKey }); notif.success('Caisse fermée avec succès'); setConfirmFermer(null); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la fermeture')
  });

  const movimientoMutation = useMutation({
    mutationFn: (data) => api.post('/boutique/caisse/mouvement', { montant: parseInt(data.montant, 10), motif: data.motif, typeMouvement: data.typeMouvement, depotId: currentDepotId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: caisseQueryKey }); notif.success('Mouvement enregistré'); setShowModal(null); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors du mouvement')
  });

  async function handleRapport() {
    setFetchingRapport(true);
    try { const res = await api.get('/boutique/caisse/rapport-journalier', { params: { depotId: currentDepotId } }); setRapportData(res.data); setShowModal('rapport'); }
    catch (err) { notif.error(err.response?.data?.message || 'Erreur lors du rapport'); }
    finally { setFetchingRapport(false); }
  }

  if (!perm.canCreate) return <div className="p-6 text-center text-red-400">Accès refusé</div>;
  if (!depotActif) return <div className="p-6 text-center text-yellow-400">Dépôt non sélectionné</div>;
  if (isLoading) return <div className="p-6 animate-pulse"><div className="h-32 bg-slate-800 rounded-xl" /></div>;
  if (queryError) return <div className="p-6 text-red-400">Erreur de chargement...</div>;

  const estOuverte = caisse?.statut === 'OUVERTE';
  const mouvements = caisse?.mouvements || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4"><div><h1 className="text-2xl font-black text-white">🏧 Caisse POS</h1><p className="text-slate-400 text-sm mt-1">{depotActif.nom} — {estOuverte ? '🟢 Ouverte' : '🔴 Fermée'}</p></div><div className="flex flex-wrap gap-2">{!estOuverte ? <button onClick={() => setShowModal('ouvrir')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">🔓 Ouvrir caisse</button> : <><button onClick={() => setShowModal('mouvement')} className="px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-sm">➕ Mouvement</button><button onClick={() => setConfirmFermer(true)} className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm">🔒 Fermer caisse</button></>}<button onClick={handleRapport} disabled={fetchingRapport} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm">📊 Rapport</button></div></div>
      {estOuverte ? <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><div className="lg:col-span-3"><VenteBoutiqueForm depotId={currentDepotId} onSuccess={() => queryClient.invalidateQueries({ queryKey: caisseQueryKey })} /></div><div className="space-y-4"><div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5"><p className="text-xs text-slate-400 uppercase">Solde</p><p className="text-2xl font-black text-white mt-1">{(caisse?.solde || 0).toLocaleString('fr-FR')} FCFA</p></div><div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5"><h2 className="text-sm font-bold text-white mb-2 uppercase">Mouvements</h2><div className="space-y-2 max-h-64 overflow-y-auto pr-1">{mouvements.length === 0 && <p className="text-xs text-slate-500 py-2">Aucun mouvement</p>}{mouvements.map((m, i) => <div key={i} className="flex items-center justify-between text-xs bg-slate-700/20 p-2 rounded"><span>{m.typeMouvement === 'ENTREE' ? '📥' : '📤'} {m.motif}</span><span className={m.typeMouvement === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}>{m.typeMouvement === 'ENTREE' ? '+' : '-'}{(m.montant || 0).toLocaleString('fr-FR')}</span></div>)}</div></div></div></div> : <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50"><p className="text-6xl mb-4">🔒</p><p className="text-xl font-bold text-white">La caisse est fermée</p><p className="text-slate-400 mt-2">Vous devez ouvrir la caisse pour effectuer des ventes.</p><button onClick={() => setShowModal('ouvrir')} className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20">Ouvrir la caisse maintenant</button></div>}
      <OuvrirCaisseModal isOpen={showModal === 'ouvrir'} onClose={() => setShowModal(null)} onOpen={(data) => ouvrirMutation.mutate(data)} /><MouvementCaisseModal isOpen={showModal === 'mouvement'} onClose={() => setShowModal(null)} onSubmit={(data) => movimientoMutation.mutate(data)} />
      {showModal === 'rapport' && rapportData && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"><h2 className="text-lg font-black text-white mb-4">📊 Rapport journalier</h2><div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400">Solde</p><p className="text-lg font-bold text-white">{(rapportData.solde || 0).toLocaleString('fr-FR')} F</p></div><div className="bg-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400">Statut</p><p className={`text-lg font-bold ${rapportData.statut === 'OUVERTE' ? 'text-emerald-400' : 'text-red-400'}`}>{rapportData.statut || 'N/A'}</p></div><div className="bg-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400">Entrées</p><p className="text-lg font-bold text-emerald-400">+{(rapportData.entreesJour || 0).toLocaleString('fr-FR')} F</p></div><div className="bg-slate-800 p-4 rounded-xl"><p className="text-xs text-slate-400">Sorties</p><p className="text-lg font-bold text-red-400">-{(rapportData.sortiesJour || 0).toLocaleString('fr-FR')} F</p></div></div><button onClick={() => setShowModal(null)} className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl">Fermer</button></div></div>}
      <ConfirmModal isOpen={!!confirmFermer} onConfirm={() => fermerMutation.mutate()} onCancel={() => setConfirmFermer(null)} loading={fermerMutation.isPending} title="Fermer la caisse" message="Voulez-vous vraiment fermer la caisse ?" />
    </div>
  );
}
