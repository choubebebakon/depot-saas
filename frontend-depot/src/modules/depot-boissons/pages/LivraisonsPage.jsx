import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const LIMIT = 100;

export default function LivraisonsPage() {
  const { metier, user } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({ fournisseurId: '', articles: '', dateLivraison: '', notes: '', depotId: '' });
  const [filtreStatut, setFiltreStatut] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  // Fetch deliveries
  const { data: deliveriesData, isLoading } = useQuery({
    queryKey: ['depot-livraisons', { filtreStatut }],
    queryFn: async () => {
      const params = { page: 1, limit: LIMIT, statut: filtreStatut || undefined };
      const res = await depotApi.getLivraisons(params);
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  // Fetch providers for creation modal
  const { data: providersData = [] } = useQuery({
    queryKey: ['depot-fournisseurs'],
    queryFn: async () => {
      const res = await depotApi.getFournisseurs({ limit: 100 });
      return res.data?.data || res.data || [];
    },
    enabled: !!showModal,
  });

  // Fetch depots for the user
  const { data: depotsData = [] } = useQuery({
    queryKey: ['depot-depots'],
    queryFn: async () => {
      const res = await depotApi.getDepots();
      return res.data?.data || res.data || [];
    },
    enabled: !!showModal,
  });

  const livraisons = Array.isArray(deliveriesData) ? deliveriesData : (deliveriesData?.data || []);
  const total = livraisons.length;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(livraisons, 10);

  const createMutation = useMutation({
    mutationFn: (data) => depotApi.createLivraison(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-livraisons'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Nouvelle livraison créée');
      setShowModal(null);
      setFormData({ fournisseurId: '', articles: '', dateLivraison: '', notes: '', depotId: '' });
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => depotApi.deleteLivraison(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-livraisons'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Livraison supprimée');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  });

  const handleCreate = () => {
    if (!formData.fournisseurId) {
      notif.warning('Veuillez sélectionner un fournisseur');
      return;
    }
    if (!formData.depotId) {
      notif.warning('Veuillez sélectionner un dépôt');
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
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Livraisons</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des entrées marchandises ({total} livraison{total > 1 ? 's' : ''})</p>
        </div>
        <button onClick={() => {
          const depotId = user?.depotActif?.id || '';
          setFormData({ fournisseurId: '', articles: '', dateLivraison: '', notes: '', depotId });
          setShowModal('create');
        }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20">
          ➕ Nouvelle livraison
        </button>
      </div>

      <div className="flex gap-3">
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="RECUE">Reçue</option>
          <option value="ANNULEE">Annulée</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-semibold">Date</th>
              <th className="text-left p-4 font-semibold">Fournisseur</th>
              <th className="text-left p-4 font-semibold">Articles</th>
              <th className="text-center p-4 font-semibold">Statut</th>
              <th className="text-right p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {totalItems === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-500">
                  <p className="text-lg mb-2">Aucune livraison</p>
                  <p className="text-sm">Créez votre première livraison</p>
                </td>
              </tr>
            ) : paginated.map(l => (
              <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 text-white">{new Date(l.dateLivraison || l.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="p-4 text-slate-300 font-medium">{l.fournisseur?.nom || '-'}</td>
                <td className="p-4 text-slate-400">{l.articles || '-'}</td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    l.statut === 'RECUE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : l.statut === 'EN_COURS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : l.statut === 'ANNULEE' ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {l.statut || 'EN_ATTENTE'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setConfirmDelete(l)} title="Supprimer"
                    className="px-2.5 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs">✕ Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">Nouvelle livraison</h2>
            <div className="space-y-4">
              <select value={formData.depotId} onChange={e => setFormData({...formData, depotId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500">
                <option value="">Sélectionner un dépôt</option>
                {depotsData.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
              <select value={formData.fournisseurId} onChange={e => setFormData({...formData, fournisseurId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500">
                <option value="">Sélectionner un fournisseur</option>
                {providersData.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              <textarea placeholder="Articles livrés (un par ligne)" value={formData.articles}
                onChange={e => setFormData({...formData, articles: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm min-h-[100px] focus:outline-none focus:border-amber-500" />
              <input type="date" value={formData.dateLivraison} onChange={e => setFormData({...formData, dateLivraison: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500" />
              <input placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={createMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {createMutation.isPending ? 'Création...' : 'Créer la livraison'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleteMutation.isPending}
        title="Supprimer la livraison" message={`Supprimer la livraison du ${confirmDelete?.dateLivraison ? new Date(confirmDelete.dateLivraison).toLocaleDateString('fr-FR') : '...'} ? Cette action est irréversible.`} />
    </div>
  );
}
