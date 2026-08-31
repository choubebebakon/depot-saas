import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useDepot } from '../../../contexts/DepotContext';
import { PERMISSIONS } from '../permissions';
import DepenseBoutiqueForm from '../forms/DepenseBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { boutiqueApi } from '../services/boutiqueApi';
import { Edit, Trash2 } from 'lucide-react';

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
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { depotId, loading: depotLoading } = useDepot() || {};
  const perm = usePermission(PERMISSIONS, 'depenses');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const expensesQueryKey = ['boutique-depenses', depotId];
  const { data: depensesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
      const res = await boutiqueApi.getDepenses({ search });
      return res.data;
    },
    enabled: Boolean(depotId) && !depotLoading,
    staleTime: 15_000,
  });

  const items = Array.isArray(depensesData?.data) ? depensesData.data : (Array.isArray(depensesData) ? depensesData : []);
  const filtres = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => !term || [item.libelle, item.motif, item.categorie, item.notes, item.modePaiement]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [items, search]);
  const totalDepenses = useMemo(() => filtres.reduce((acc, item) => acc + (Number(item.montant) || 0), 0), [filtres]);

  const deleteMutation = useMutation({
    mutationFn: (id) => boutiqueApi.deleteDepense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard', depotId] });
      notif.success('Dépense supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => notif.error(getErrorMessage(err, 'Erreur lors de la suppression de la dépense')),
  });

  const openCreate = () => {
    if (!depotId) {
      notif.error('Sélectionnez un dépôt actif avant de créer une dépense.');
      return;
    }
    setEditItem(null);
    setFormOpen(true);
  };

  if (depotLoading) {
    return <div className="p-6 flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-slate-400">Aucun dépôt actif sélectionné.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">💸 Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} dépense{filtres.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total</p><p className="font-black text-xl text-red-400">{totalDepenses.toLocaleString('fr-FR')} F</p></div>
          {perm.canCreate && <button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle dépense</button>}
        </div>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Rechercher par libellé, motif, catégorie..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full max-w-md" />
      </div>

      {isError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-300 font-semibold">{getErrorMessage(error, 'Impossible de charger les dépenses.')}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700">Réessayer</button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              <th className="text-left px-5 py-4">Libellé / Motif</th><th className="text-left px-5 py-4">Catégorie</th><th className="text-left px-5 py-4">Date</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune dépense correspondant aux critères.</td></tr> : filtres.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-4 text-white font-semibold">{item.libelle || item.motif || '-'}</td>
                  <td className="px-5 py-4 text-cyan-400 text-sm">{item.categorie || '-'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{item.createdAt || item.date ? new Date(item.createdAt || item.date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="px-5 py-4 text-right text-red-400 font-mono font-bold">-{(Number(item.montant) || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">
                    {perm.canEdit && <button onClick={() => { setEditItem(item); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg"><Edit className="w-4 h-4" /></button>}
                    {perm.canDelete && <button onClick={() => setConfirmDelete(item)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && <DepenseBoutiqueForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} onSuccess={() => { setFormOpen(false); setEditItem(null); }} edit={editItem} />}
      {confirmDelete && <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => deleteMutation.mutate(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} title="Supprimer la dépense" message={`Supprimer « ${confirmDelete.libelle || confirmDelete.motif || 'cette dépense'} » ?`} loading={deleteMutation.isPending} />}
    </div>
  );
}
