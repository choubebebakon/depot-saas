import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import ClientBoutiqueForm from '../forms/ClientBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { boutiqueApi } from '../services/boutiqueApi';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const perm = usePermission(PERMISSIONS, 'clients');

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['boutique-clients', search],
    queryFn: async () => {
      const res = await boutiqueApi.getClients({ search });
      return res.data;
    },
  });

  const items = clientsData?.data || [];
  const totalItems = clientsData?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return boutiqueApi.deleteClient(id);
    },
    onSuccess: () => {
      notif.success('Client supprimé');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-clients'] });
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
          <h1 className="text-2xl font-black text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} client{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20"
          >
            + Nouveau Client
          </button>
        )}
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Nom, email..."
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
                <th className="text-left px-5 py-4">Nom</th>
                <th className="text-left px-5 py-4">Email</th>
                <th className="text-left px-5 py-4">Téléphone</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun client</td></tr>
              ) : items.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-cyan-600/20 rounded-xl flex items-center justify-center text-cyan-400 font-black text-sm">
                        {i.nom?.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm">{i.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{i.email || ''}</td>
                  <td className="px-5 py-4 text-white">{i.telephone || ''}</td>
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
        <ClientBoutiqueForm
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
          title="Supprimer le client"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.nom}" ?`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
