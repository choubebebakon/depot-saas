import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useDepot } from '../../../contexts/DepotContext';
import { depotApi } from '../services/depotApi';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const CATEGORIES = ['Carburant', 'Réparation', 'Achat marchandise', 'Transport', 'Fourniture', 'Eau/Électricité', 'Loyer', 'Salaire', 'Marketing', 'Autre'];
const LIMIT = 100;

const getErrorMessage = (error, fallback) => {
  const status = error?.response?.status;
  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (status === 403) return 'Vous n’avez pas la permission d’accéder aux dépenses de ce dépôt.';
  if (status === 404) return 'Le service des dépenses est introuvable.';
  if (status === 422) return 'Les données de la dépense sont invalides.';
  if (status >= 500) return 'Le serveur a rencontré une erreur. Réessayez dans un instant.';
  if (!error?.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  return error?.response?.data?.message || fallback;
};

export default function DepensesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('depenses');
  const { depotId, loading: depotLoading } = useDepot() || {};

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().slice(0, 10) });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  const expensesQueryKey = ['depot-depenses', depotId];
  const { data: depensesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
      const res = await depotApi.getDepenses({ page: 1, limit: LIMIT });
      return res.data;
    },
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId) && !depotLoading,
    staleTime: 15_000,
  });

  const depenses = useMemo(() => {
    if (Array.isArray(depensesData?.data)) return depensesData.data;
    return Array.isArray(depensesData) ? depensesData : [];
  }, [depensesData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return depenses;
    return depenses.filter((item) => [item.motif, item.libelle, item.categorie]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [depenses, search]);

  const totalDepenses = useMemo(() => filtered.reduce((sum, item) => sum + (Number(item.montant) || 0), 0), [filtered]);

  const createMutation = useMutation({
    mutationFn: (data) => depotApi.createDepense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['depot-caisse'] });
      notif.success('Dépense enregistrée');
      setShowModal(false);
      setFormData({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().slice(0, 10) });
    },
    onError: (err) => notif.error(getErrorMessage(err, 'Erreur lors de la création de la dépense')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => depotApi.deleteDepense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['depot-caisse'] });
      notif.success('Dépense supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => notif.error(getErrorMessage(err, 'Erreur lors de la suppression de la dépense')),
  });

  const handleCreate = () => {
    const montant = Number(formData.montant);
    const motif = formData.motif.trim();
    if (!Number.isFinite(montant) || montant <= 0) {
      notif.warning('Veuillez saisir un montant supérieur à 0.');
      return;
    }
    if (!motif) {
      notif.warning('Le motif de la dépense est obligatoire.');
      return;
    }
    if (!depotId) {
      notif.error('Aucun dépôt actif sélectionné.');
      return;
    }

    createMutation.mutate({
      id: crypto.randomUUID(),
      montant,
      motif,
      categorie: formData.categorie,
      depotId,
    });
  };

  if (metier !== 'DEPOT_BOISSONS') return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  if (depotLoading) return <div className="p-6 flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!depotId) return <div className="p-6 text-center text-slate-400">Aucun dépôt actif sélectionné.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} dépense{filtered.length !== 1 ? 's' : ''} · Total : <span className="text-red-400 font-bold">{totalDepenses.toLocaleString('fr-FR')} FCFA</span></p>
        </div>
        {canWrite && <button onClick={() => setShowModal(true)} className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm">+ Nouvelle dépense</button>}
      </div>

      <input type="text" placeholder="Rechercher par motif ou catégorie..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-lg px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30" />

      {isError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center"><p className="text-red-300 font-semibold">{getErrorMessage(error, 'Impossible de charger les dépenses.')}</p><button onClick={() => refetch()} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold">Réessayer</button></div>
      ) : isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 bg-slate-800/60 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><th className="text-left p-4">Date</th><th className="text-left p-4">Motif</th><th className="text-center p-4">Catégorie</th><th className="text-right p-4">Montant</th><th className="text-right p-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-500">Aucune dépense correspondant aux critères.</td></tr> : filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40"><td className="p-4 text-white">{new Date(d.date || d.createdAt).toLocaleDateString('fr-FR')}</td><td className="p-4 text-slate-300">{d.motif || d.libelle || '-'}</td><td className="p-4 text-center"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300">{d.categorie || 'Autre'}</span></td><td className="p-4 text-right text-red-400 font-bold">-{(Number(d.montant) || 0).toLocaleString('fr-FR')} FCFA</td><td className="p-4 text-right">{canWrite && <button onClick={() => setConfirmDelete(d)} disabled={deleteMutation.isPending} className="px-2.5 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 disabled:opacity-50">Supprimer</button>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"><h2 className="text-lg font-black text-white mb-4">Nouvelle dépense</h2><div className="space-y-4"><input type="number" min="0.01" step="0.01" placeholder="Montant (FCFA) *" value={formData.montant} onChange={(e) => setFormData({ ...formData, montant: e.target.value })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" /><input maxLength={500} placeholder="Motif *" value={formData.motif} onChange={(e) => setFormData({ ...formData, motif: e.target.value })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" /><select value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} disabled={createMutation.isPending} className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl">Annuler</button><button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 px-4 py-3 bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl">{createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}</button></div></div></div>}
      {confirmDelete && <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => deleteMutation.mutate(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending} title="Supprimer la dépense" message={`Supprimer « ${confirmDelete.motif || confirmDelete.libelle || 'cette dépense'} » ?`} />}
    </div>
  );
}
