import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import DepenseBoutiqueForm from '../forms/DepenseBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { boutiqueApi } from '../services/boutiqueApi';

export default function DepensesPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const perm = usePermission(PERMISSIONS, 'depenses');

  const { data: depensesData, isLoading } = useQuery({
    queryKey: ['boutique-depenses', search],
    queryFn: async () => {
      const res = await boutiqueApi.getDepenses({ search });
      return res.data;
    },
  });

  const items = depensesData?.data || [];
  const totalItems = depensesData?.total || 0;
  const totalDepenses = items.reduce((acc, i) => acc + (i.montant || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return boutiqueApi.deleteDepense(id);
    },
    onSuccess: () => {
      notif.success('Dépense supprimée');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard'] });
    },
    onError: () => {
      notif.error('Erreur lors de la suppression');
    },
  });

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id);
  };

  const filtres = items.filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">💸 Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} dépense{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total</p>
            <p className="font-black text-xl text-red-400">{totalDepenses.toLocaleString('fr-FR')} F</p>
          </div>
          {perm.canCreate && (
            <button
              onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20"
            >
              + Nouvelle Dépense
            </button>
          )}
        </div>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Libellé..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72"
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Libellé</th>
                <th className="text-left px-5 py-4">Catégorie</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune dépense</td></tr>
              ) : filtres.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{i.libelle}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                      {i.categorie}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {i.createdAt ? new Date(i.createdAt).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-5 py-4 text-right text-red-400 font-mono font-bold">
                    -{(i.montant || 0).toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      {perm.canEdit && (
                        <button
                          onClick={() => { setEditItem(i); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm"
                        >
                          ✏️ Modifier
                        </button>
                      )}
                      {perm.canDelete && (
                        <button
                          onClick={() => setConfirmDelete(i)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {formOpen && (
        <DepenseBoutiqueForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={() => { setFormOpen(false); }}
          edit={editItem}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer la dépense"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.libelle}" ?`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
