import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import TourneeForm from '../forms/TourneeForm';
import ChargementForm from '../forms/ChargementForm';
import TricycleForm from '../forms/TricycleForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const STATUT_COLORS = {
  PLANIFIEE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  EN_COURS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TERMINEE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ANNULEE: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const LIMIT = 100;

export default function TourneesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [selectedTournee, setSelectedTournee] = useState(null);
  const [recap, setRecap] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [chargementOpen, setChargementOpen] = useState(false);
  const [chargementTourneeId, setChargementTourneeId] = useState(null);
  const [tricycleFormOpen, setTricycleFormOpen] = useState(false);
  const [tricycleEditItem, setTricycleEditItem] = useState(null);
  const [search, setSearch] = useState('');

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  // Fetch tournees via useQuery
  const { data: tourneesData, isLoading } = useQuery({
    queryKey: ['depot-tournees'],
    queryFn: async () => {
      const res = await depotApi.getTournees({ page: 1, limit: LIMIT });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const tournees = Array.isArray(tourneesData) ? tourneesData : (tourneesData?.data || []);
  const total = tournees.length;

  const filtres = tournees.filter(item =>
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

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (t) => { setEditItem(t); setFormOpen(true); };
  const openTricycleCreate = () => { setTricycleEditItem(null); setTricycleFormOpen(true); };

  const demarrerMutation = useMutation({
    mutationFn: (id) => depotApi.demarrerTournee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      notif.success('Tournée démarrée');
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors du démarrage');
    }
  });

  const cloturerMutation = useMutation({
    mutationFn: ({ id, montant }) => depotApi.cloturerTournee(id, { montant }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Tournée clôturée avec succès');
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la clôture');
    }
  });

  const handleDemarrer = (id) => {
    demarrerMutation.mutate(id);
  };

  const handleCloturer = (id) => {
    const montant = prompt('Montant total des ventes de la tournée :');
    if (!montant || isNaN(montant)) return;
    cloturerMutation.mutate({ id, montant: parseInt(montant) });
  };

  const handleCharger = (id) => {
    setChargementTourneeId(id);
    setChargementOpen(true);
  };

  const handleVoirRecap = async (id) => {
    try {
      const res = await depotApi.getRecapTournee(id);
      setRecap(res.data);
      setSelectedTournee(id);
    } catch (err) {
      notif.error('Erreur de chargement du récapitulatif');
    }
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tournées</h1>
          <p className="text-slate-400 text-sm mt-1">Planification et suivi des tournées tricycle ({total} tournée{total > 1 ? 's' : ''})</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openTricycleCreate}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20">
            🚚 Nouveau tricycle
          </button>
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
            ➕ Nouvelle tournée
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="🔍 Rechercher une tournée..." value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
      </div>

      {totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">🚚</p>
          <p className="text-lg font-medium">Aucune tournée planifiée</p>
          <p className="text-sm mt-1">Créez votre première tournée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(t => (
            <div key={t.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{t.commercial?.nom || 'Commercial'}</p>
                    <p className="text-xs text-slate-500">{t.tricycle || 'Tricycle'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUT_COLORS[t.statut] || STATUT_COLORS.PLANIFIEE}`}>
                    {t.statut || 'PLANIFIEE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '-'}
                </p>
                {t.notes && <p className="text-xs text-slate-500 mb-3 italic">{t.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {t.statut === 'PLANIFIEE' && (
                  <>
                    <button onClick={() => handleDemarrer(t.id)} disabled={demarrerMutation.isPending}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all">Démarrer</button>
                    <button onClick={() => handleCharger(t.id)}
                      className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">Charger</button>
                  </>
                )}
                {t.statut === 'EN_COURS' && (
                  <button onClick={() => handleCloturer(t.id)} disabled={cloturerMutation.isPending}
                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] transition-all">Clôturer</button>
                )}
                {(t.statut === 'TERMINEE' || t.statut === 'CLOTURE_COMMERCIALE') && (
                  <button onClick={() => handleVoirRecap(t.id)}
                    className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">Récapitulatif</button>
                )}
                <button onClick={() => openEdit(t)}
                  className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px] transition-all">✏️ Modifier</button>
              </div>
            </div>
          ))}
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

      {recap && selectedTournee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setRecap(null); setSelectedTournee(null); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-white mb-4">Récapitulatif tournée</h2>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-400">Articles chargés</span>
                <span className="text-white font-bold">{recap.articlesCharges || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-400">Articles vendus</span>
                <span className="text-emerald-400 font-bold">{recap.articlesVendus || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-400">Retours</span>
                <span className="text-orange-400 font-bold">{recap.retours || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-400">Montant total</span>
                <span className="text-white font-bold text-lg">{(recap.montant || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
            <button onClick={() => { setRecap(null); setSelectedTournee(null); }}
              className="w-full mt-6 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Fermer</button>
          </div>
        </div>
      )}

      <TourneeForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ChargementForm isOpen={chargementOpen} onClose={() => { setChargementOpen(false); setChargementTourneeId(null); }} metier="depot-boissons" tourneeId={chargementTourneeId} />
      <TricycleForm isOpen={tricycleFormOpen} onClose={() => setTricycleFormOpen(false)} edit={tricycleEditItem} metier="depot-boissons" />
      <ConfirmModal isOpen={false} onConfirm={() => {}} onCancel={() => {}}
        title="Supprimer" message={`Supprimer cette tournée ? Cette action est irréversible.`} />
    </div>
  );
}
