import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const CATEGORIES_DEPENSES = [
  'Carburant', 'Réparation', 'Achat marchandise', 'Transport', 'Fourniture',
  'Eau/Électricité', 'Loyer', 'Salaire', 'Marketing', 'Autre'
];

const LIMIT = 100;

export default function DepensesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().split('T')[0] });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  // Fetch expenses
  const { data: depensesData, isLoading } = useQuery({
    queryKey: ['depot-depenses'],
    queryFn: async () => {
      const res = await depotApi.getDepenses({ page: 1, limit: LIMIT });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const depenses = Array.isArray(depensesData) ? depensesData : (depensesData?.data || []);
  const total = depenses.length;

  const totalDepenses = depenses.reduce((acc, i) => acc + (Number(i.montant) || 0), 0);

  const filtres = depenses.filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(filtres, 10);

  const createMutation = useMutation({
    mutationFn: (data) => depotApi.createDepense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Nouvelle dépense enregistrée');
      setShowModal(null);
      setFormData({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().split('T')[0] });
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => depotApi.deleteDepense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Dépense supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const handleCreate = () => {
    if (!formData.montant || isNaN(formData.montant) || Number(formData.montant) <= 0) {
      notif.warning('Veuillez saisir un montant valide');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete.id);
    }
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total > 0 ? `${total} dépense${total > 1 ? 's' : ''} · Total: ${totalDepenses.toLocaleString('fr-FR')} FCFA` : 'Aucune dépense'}
          </p>
        </div>
        <button onClick={() => setShowModal('create')}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-orange-600/20">
          ➕ Nouvelle dépense
        </button>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="🔍 Rechercher une dépense..." value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
      </div>

      {totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">💸</p>
          <p className="text-lg font-medium">Aucune dépense enregistrée</p>
          <p className="text-sm mt-1">Cliquez sur "Nouvelle dépense" pour commencer</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Motif</th>
                <th className="text-center p-4 font-semibold">Catégorie</th>
                <th className="text-right p-4 font-semibold">Montant</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-white">{new Date(d.date || d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-slate-300">{d.motif || '-'}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {d.categorie || 'Autre'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-red-400 font-bold">-{ (Number(d.montant) || 0).toLocaleString('fr-FR') } FCFA</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setConfirmDelete(d)} title="Supprimer"
                      className="px-2.5 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs">✕ Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      {showModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">Nouvelle dépense</h2>
            <div className="space-y-4">
              <input type="number" placeholder="Montant (FCFA) *" value={formData.montant}
                onChange={e => setFormData({...formData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Motif" value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500" />
              <select value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500">
                {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={createMutation.isPending}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending}
        title="Supprimer la dépense" message={`Supprimer la dépense de ${(parseInt(confirmDelete?.montant || 0)).toLocaleString('fr-FR')} FCFA ? Cette action est irréversible.`} />
    </div>
  );
}
