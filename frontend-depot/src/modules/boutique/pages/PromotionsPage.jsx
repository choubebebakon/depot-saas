import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import PromotionBoutiqueForm from '../forms/PromotionBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { boutiqueApi } from '../services/boutiqueApi';

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const perm = usePermission(PERMISSIONS, 'promotions');

  const { data: promotionsData, isLoading } = useQuery({
    queryKey: ['boutique-promotions'],
    queryFn: async () => {
      const res = await boutiqueApi.getPromotions();
      return res.data;
    },
  });

  const items = promotionsData || [];
  const totalItems = items.length;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return boutiqueApi.deletePromotion(id);
    },
    onSuccess: () => {
      notif.success('Promotion supprimée');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-promotions'] });
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
          <h1 className="text-2xl font-black text-white">🎉 Promotions</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} promotion{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20"
          >
            + Nouvelle Promotion
          </button>
        )}
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
                <th className="text-left px-5 py-4">Type</th>
                <th className="text-right px-5 py-4">Valeur</th>
                <th className="text-left px-5 py-4">Du</th>
                <th className="text-left px-5 py-4">Au</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucune promotion</td></tr>
              ) : filtres.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{i.libelle}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-full">
                      {i.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-white font-mono">
                    {i.valeur}{i.type === 'REMISE' ? '%' : ' F'}
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {i.dateDebut ? new Date(i.dateDebut).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {i.dateFin ? new Date(i.dateFin).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {i.actif ? (
                      <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Actif</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full">Inactif</span>
                    )}
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
        <PromotionBoutiqueForm
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
          title="Supprimer la promotion"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.libelle}" ?`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
