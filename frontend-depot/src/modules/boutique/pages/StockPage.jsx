import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import StockBoutiqueForm from '../forms/StockBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { boutiqueApi } from '../services/boutiqueApi';

export default function StockPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const perm = usePermission(PERMISSIONS, 'stock');

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['boutique-stock', search],
    queryFn: async () => {
      const res = await boutiqueApi.getStock({ search });
      return res.data;
    },
  });

  const items = stockData?.data || [];
  const totalItems = stockData?.total || 0;
  const valueStock = items.reduce((acc, i) => acc + (i.prixVente || 0) * (i.quantite || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return boutiqueApi.deleteArticle(id);
    },
    onSuccess: () => {
      notif.success('Article supprimé');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'] });
    },
    onError: () => {
      notif.error('Erreur lors de la suppression');
    },
  });

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Stock</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} produit{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Valeur stock</p>
            <p className="font-black text-xl text-cyan-400">{valueStock.toLocaleString('fr-FR')} F</p>
          </div>
          {perm.canCreate && (
            <button
              onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20"
            >
              + Nouveau Produit
            </button>
          )}
        </div>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Nom produit..."
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
                <th className="text-left px-5 py-4">Produit</th>
                <th className="text-right px-5 py-4">Qt</th>
                <th className="text-right px-5 py-4">Seuil</th>
                <th className="text-right px-5 py-4">Prix achat</th>
                <th className="text-right px-5 py-4">Prix vente</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucun produit</td></tr>
              ) : items.map(i => {
                const alerte = i.quantite <= i.seuilCritique;
                return (
                  <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{i.designation}</td>
                    <td className={`px-5 py-4 text-right font-mono font-bold ${alerte ? 'text-red-400' : 'text-white'}`}>{i.quantite}</td>
                    <td className="px-5 py-4 text-right text-slate-300">{i.seuilCritique || 0}</td>
                    <td className="px-5 py-4 text-right text-slate-300">{(i.prixAchat || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-right text-green-400">{(i.prixVente || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-center">
                      {alerte ? (
                        <span className="text-[10px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Critique</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-1 rounded-full">OK</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {formOpen && (
        <StockBoutiqueForm
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
          title="Supprimer le produit"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.designation}" ?`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
