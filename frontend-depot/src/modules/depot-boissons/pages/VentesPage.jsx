import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import VenteBoissonsForm from '../forms/VenteBoissonsForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const LIMIT = 100;

export default function VentesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['depot-ventes'],
    queryFn: async () => {
      const res = await depotApi.getVentes({ page: 1, limit: LIMIT });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const ventes = Array.isArray(data) ? data : (data?.data || []);
  const total = ventes.length;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(ventes, 10);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const annulerVenteMutation = useMutation({
    mutationFn: (id) => depotApi.annulerVente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Vente annulée avec succès');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'annulation de la vente');
    }
  });

  const handleAnnulerVente = () => {
    if (confirmDelete) {
      annulerVenteMutation.mutate(confirmDelete.id);
    }
  };

  const handlePrint = async (id) => {
    try {
      const r = await depotApi.imprimerTicket(id);
      const url = URL.createObjectURL(r.data);
      window.open(url);
    } catch (err) {
      notif.error('Erreur lors de l\'impression du ticket');
    }
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Historique des ventes ({total} vente{total > 1 ? 's' : ''})</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30">
          ➕ Nouvelle vente
        </button>
      </div>

      {totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">💸</p>
          <p className="text-lg font-medium">Aucune vente enregistrée</p>
          <p className="text-sm mt-1">Cliquez sur "Nouvelle vente" pour commencer</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Client</th>
                <th className="text-right p-4 font-semibold">Articles</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="text-center p-4 font-semibold">Paiement</th>
                <th className="text-center p-4 font-semibold">Statut</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginated.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-white">{new Date(v.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-slate-400">{v.client?.nom || 'Comptoir'}</td>
                  <td className="p-4 text-right text-white">{v.nbArticles || v.articles?.length || '-'}</td>
                  <td className="p-4 text-right text-white font-bold">{parseInt(v.total).toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {v.modePaiement || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      v.statut === 'ANNULEE' || v.statut === 'ANNULE' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {v.statut || 'VALIDEE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handlePrint(v.id)}
                        title="Imprimer ticket" className="px-2.5 py-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all text-xs">🖨️ Ticket</button>
                      {(v.statut !== 'ANNULEE' && v.statut !== 'ANNULE') && (
                        <button onClick={() => setConfirmDelete(v)} title="Annuler"
                          className="px-2.5 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs">✕ Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      <VenteBoissonsForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleAnnulerVente} onCancel={() => setConfirmDelete(null)} loading={annulerVenteMutation.isPending}
        title="Annuler la vente" message={`Annuler la vente de ${parseInt(confirmDelete?.total || 0).toLocaleString('fr-FR')} FCFA ? Cette action est irréversible.`} />
    </div>
  );
}
