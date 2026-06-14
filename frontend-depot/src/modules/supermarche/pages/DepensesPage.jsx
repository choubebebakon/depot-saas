import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import DepenseForm from '../forms/DepenseForm';

export default function DepensesPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth, tenantId } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const queryClient = useQueryClient();

  const CATEGORIES = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Téléphone', 'Internet', 'Fournitures', 'Maintenance', 'Transport', 'Publicité', 'Autre'];

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'depenses');

  const { data: depensesData = [], isLoading: loading } = useQuery({
    queryKey: ['supermarche-depenses', tenantId],
    queryFn: async () => {
      const res = await api.get(`/${prefix}/depenses`);
      return res.data;
    },
    enabled: !!tenantId,
  });
  const depenses = Array.isArray(depensesData?.data) ? depensesData.data : (Array.isArray(depensesData) ? depensesData : []);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/${prefix}/depenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      success('Dépense supprimée');
      setConfirmDelete(null);
    },
    onError: () => {
      notifError('Erreur lors de la suppression', 'Échec');
    }
  });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (depenses || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;

  const openEdit = (item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const [catFiltre, setCatFiltre] = useState('');

  const totalFiltre = filtres.reduce((acc, i) => acc + (i.montant || 0), 0);


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} dépense{filtres.length !== 1 ? 's' : ''}  Total: <span className="text-red-400 font-bold">{totalFiltre.toLocaleString('fr-FR')} F</span></p>
        </div>
        {perm.canCreate && (
        <button onClick={openCreate}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">
          + Nouvelle Dépense
        </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-56" />
        <select value={catFiltre} onChange={e => setCatFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Libellé</th>
                <th className="text-left px-5 py-4">Catégorie</th>
                <th className="text-left px-5 py-4">Paiement</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune dépense enregistrée</td></tr>
              ) : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-slate-300 text-sm whitespace-nowrap">{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : ''}</td>
                  <td className="px-5 py-3">
                    <p className="text-white font-semibold text-sm">{d.libelle}</p>
                    {d.notes && <p className="text-slate-500 text-xs">{d.notes}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">{d.categorie}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{d.modePaiement || ''}</td>
                  <td className="px-5 py-3 text-right text-red-400 font-bold text-sm">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {perm.canEdit && (
                      <button onClick={() => openEdit(d)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>
                      )}
                      {perm.canDelete && (
                      <button onClick={() => setConfirmDelete(d)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️ Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} dépense{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}

      <DepenseForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success('Dépense enregistrée ✓'); }} edit={editItem} metier={prefix} />

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => deleteMutation.mutate(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending}
        title="Supprimer la dépense" message={`Supprimer  ${confirmDelete?.libelle}  ? Cette action est irréversible.`} />
    </div>
  );
}
