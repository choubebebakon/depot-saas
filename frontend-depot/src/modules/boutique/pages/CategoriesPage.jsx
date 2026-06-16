import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useSectorQuery } from '../../../hooks/useSectorQuery';
import { boutiqueApi } from '../services/boutiqueApi';
import CategorieForm from '../forms/CategorieForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const TYPES_BOUTIQUE = [
  { key: 'parfumerie', label: 'Parfumerie', icone: '🌸' },
  { key: 'librairie', label: 'Librairie', icone: '📚' },
  { key: 'telephonie', label: 'Téléphonie', icone: '📱' },
  { key: 'salon_beaute', label: 'Salon de beauté', icone: '💅' },
  { key: 'glacier', label: 'Glacier / Snack', icone: '🍦' },
];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [seedOpen, setSeedOpen] = useState(false);

  const { data: categories = [], isLoading } = useSectorQuery(
    ['boutique-categories'],
    async () => {
      const res = await boutiqueApi.getCategories();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => boutiqueApi.deleteCategorie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-categories'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'] });
      success('Catégorie supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notifError(err.response?.data?.message || 'Erreur lors de la suppression', 'Échec');
    },
  });

  const seedMutation = useMutation({
    mutationFn: (type) => boutiqueApi.seedCategories(type),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['boutique-categories'] });
      success(`${res.data?.created || 0} catégories créées pour ${res.data?.type}`);
      setSeedOpen(false);
    },
    onError: (err) => {
      notifError(err.response?.data?.message || 'Erreur lors de l\'initialisation', 'Échec');
    },
  });

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete.id);
    }
  };

  const handleSeed = (type) => {
    seedMutation.mutate(type);
  };

  const filteredCategories = search
    ? categories.filter((c) => c.nom?.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion des Catégories</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filteredCategories.length} catégorie{filteredCategories.length !== 1 ? 's' : ''} configurée{filteredCategories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setSeedOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            🌱 Initialiser
          </button>
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            + Nouvelle
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher une catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">🏷️</span>
          <p className="text-slate-400 font-semibold mt-4">Aucune catégorie créée</p>
          <p className="text-slate-500 text-sm mt-1">Initialisez les catégories ou créez-en une manuellement</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((c) => (
            <div
              key={c.id}
              className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all group"
              style={{ borderLeftColor: c.couleur || '#6366f1', borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg mb-3"
                    style={{ backgroundColor: `${c.couleur || '#6366f1'}33` }}
                  >
                    {c.icone || '🏷️'}
                  </div>
                  <h3 className="text-white font-bold text-base">{c.nom}</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    {c._count?.articles || 0} article{c._count?.articles !== 1 ? 's' : ''}
                  </p>
                  {!c.actif && (
                    <span className="text-slate-500 text-xs mt-1 block">⚠️ Inactive</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditItem(c); setFormOpen(true); }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategorieForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['boutique-categories'] });
        }}
        edit={editItem}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMutation.isPending}
        title="Supprimer la catégorie"
        message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`}
      />

      <ConfirmModal
        isOpen={seedOpen}
        onConfirm={() => setSeedOpen(false)}
        onCancel={() => setSeedOpen(false)}
        loading={seedMutation.isPending}
        title="Initialiser les catégories"
        message={
          <div className="space-y-3">
            <p className="text-slate-300">Choisissez le type de boutique pour initialiser les catégories prédéfinies :</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {TYPES_BOUTIQUE.map((type) => (
                <button
                  key={type.key}
                  onClick={() => handleSeed(type.key)}
                  disabled={seedMutation.isPending}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl p-4 text-left transition-all disabled:opacity-50"
                >
                  <span className="text-2xl block mb-2">{type.icone}</span>
                  <span className="text-white font-semibold text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        }
        showCancel={true}
        confirmLabel="Annuler"
      />
    </div>
  );
}
