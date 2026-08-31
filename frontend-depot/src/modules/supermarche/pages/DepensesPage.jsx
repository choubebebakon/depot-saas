import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../contexts/DepotContext';
import api from '../../../api/axios';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import DepenseForm from '../forms/DepenseForm';

const CATEGORIES = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Téléphone', 'Internet', 'Fournitures', 'Maintenance', 'Transport', 'Publicité', 'Autre'];

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
  const { metier: metierAuth } = useAuth();
  const { depotId, loading: depotLoading } = useDepot() || {};
  const metier = (metierAuth || 'supermarche').toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'depenses');

  const [search, setSearch] = useState('');
  const [catFiltre, setCatFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const expensesQueryKey = ['supermarche-depenses', depotId];

  const {
    data: depensesData,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
      const res = await api.get(`/${metier}/depenses`);
      return res.data;
    },
    enabled: Boolean(depotId) && !depotLoading,
    staleTime: 15_000,
  });

  const depenses = useMemo(() => {
    if (Array.isArray(depensesData?.data)) return depensesData.data;
    return Array.isArray(depensesData) ? depensesData : [];
  }, [depensesData]);

  const filtres = useMemo(() => {
    const term = search.trim().toLowerCase();
    return depenses.filter((item) => {
      const matchesSearch = !term || [item.libelle, item.motif, item.categorie, item.modePaiement, item.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesCategory = !catFiltre || item.categorie === catFiltre;
      return matchesSearch && matchesCategory;
    });
  }, [depenses, search, catFiltre]);

  const {
    currentPage,
    setCurrentPage,
    goToPage,
    totalPages,
    paginatedData: paginated,
  } = usePagination(filtres, 10);

  const totalFiltre = useMemo(
    () => filtres.reduce((acc, item) => acc + (Number(item.montant) || 0), 0),
    [filtres],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/${metier}/depenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard', depotId] });
      success('Dépense supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => notifError(getErrorMessage(err, 'Erreur lors de la suppression de la dépense'), 'Échec'),
  });

  const openCreate = () => {
    if (!depotId) {
      notifError('Sélectionnez un dépôt actif avant de créer une dépense.', 'Dépôt requis');
      return;
    }
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategory = (value) => {
    setCatFiltre(value);
    setCurrentPage(1);
  };

  if (depotLoading) {
    return <div className="p-6 flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-slate-400">Aucun dépôt actif sélectionné.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtres.length} dépense{filtres.length !== 1 ? 's' : ''} · Total :{' '}
            <span className="text-red-400 font-bold">{totalFiltre.toLocaleString('fr-FR')} F</span>
          </p>
        </div>
        {perm.canCreate && (
          <button onClick={openCreate} className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">
            + Nouvelle dépense
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par libellé, motif, catégorie..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
        />
        <select value={catFiltre} onChange={(e) => handleCategory(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {isError ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <p className="text-red-300 font-semibold">{getErrorMessage(error, 'Impossible de charger les dépenses.')}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700">Réessayer</button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-left px-5 py-4">Libellé / Motif</th>
                  <th className="text-left px-5 py-4">Catégorie</th>
                  <th className="text-left px-5 py-4">Paiement</th>
                  <th className="text-right px-5 py-4">Montant</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune dépense correspondant aux critères.</td></tr>
                ) : paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3 text-slate-300 text-sm whitespace-nowrap">{d.date || d.createdAt ? new Date(d.date || d.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-5 py-3"><p className="text-white font-semibold text-sm">{d.libelle || d.motif || '-'}</p>{d.notes && <p className="text-slate-500 text-xs mt-1">{d.notes}</p>}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">{d.categorie || '-'}</span></td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{d.modePaiement || '-'}</td>
                    <td className="px-5 py-3 text-right text-red-400 font-bold text-sm">-{(Number(d.montant) || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-3 text-center"><div className="flex items-center justify-center gap-1">
                      {perm.canEdit && <button onClick={() => openEdit(d)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️ Modifier</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(d)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm">🗑️ Supprimer</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">Page {currentPage}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 disabled:opacity-30">Précédent</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const page = start + index;
                  if (page > totalPages) return null;
                  return <button key={page} onClick={() => goToPage(page)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentPage === page ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{page}</button>;
                })}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 disabled:opacity-30">Suivant</button>
              </div>
            </div>
          )}
        </div>
      )}

      <DepenseForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        onSuccess={() => { setFormOpen(false); setEditItem(null); }}
        edit={editItem}
        metier={metier}
      />

      {confirmDelete && <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => deleteMutation.mutate(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending} title="Supprimer la dépense" message={`Supprimer « ${confirmDelete.libelle || confirmDelete.motif || 'cette dépense'} » ?`} />}
    </div>
  );
}
