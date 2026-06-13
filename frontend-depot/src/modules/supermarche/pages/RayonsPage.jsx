import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useSectorQuery } from '../../../hooks/useSectorQuery';
import { supermarcheApi } from '../services/supermarcheApi';
import RayonForm from '../forms/RayonForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function RayonsPage() {
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  const { data: rayons = [], isLoading } = useSectorQuery(
    ['supermarche-rayons', { search }],
    async () => {
      const res = await supermarcheApi.getRayons({ search });
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => supermarcheApi.deleteRayon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-rayons'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      success('Rayon supprimé');
      setConfirmDelete(null);
    },
    onError: () => {
      notifError('Erreur lors de la suppression', 'Échec');
    },
  });

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete.id);
    }
  };

  const filteredRayons = search
    ? rayons.filter((r) => r.nom?.toLowerCase().includes(search.toLowerCase()))
    : rayons;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion des Rayons</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filteredRayons.length} rayon{filteredRayons.length !== 1 ? 's' : ''} configuré{filteredRayons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          + Nouveau Rayon
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher un rayon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRayons.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">{String.fromCodePoint(0x1F5C2)}</span>
          <p className="text-slate-400 font-semibold mt-4">Aucun rayon créé</p>
          <p className="text-slate-500 text-sm mt-1">Créez vos rayons pour organiser votre supermarché</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRayons.map((r) => (
            <div
              key={r.id}
              className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all group"
              style={{ borderLeftColor: r.couleur || '#f59e0b', borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg mb-3"
                    style={{ backgroundColor: `${r.couleur || '#f59e0b'}33` }}
                  >
                    {r.nom?.[0]?.toUpperCase() || String.fromCodePoint(0x1F5C2)}
                  </div>
                  <h3 className="text-white font-bold text-base">{r.nom}</h3>
                  <p className="text-slate-500 text-xs mt-1">Ordre: {r.ordre ?? 0}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditItem(r); setFormOpen(true); }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    title="Modifier"
                  >
                    {String.fromCodePoint(0x270F)}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(r)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                    title="Supprimer"
                  >
                    {String.fromCodePoint(0x1F5D1)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RayonForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['supermarche-rayons'] });
        }}
        edit={editItem}
      />
      <ConfirmModal
        isOpen={!!confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMutation.isPending}
        title="Supprimer le rayon"
        message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`}
      />
    </div>
  );
}
