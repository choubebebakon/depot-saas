import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useDepot } from '../../../contexts/DepotContext';
import { depotApi } from '../services/depotApi';
import TourneeForm from '../forms/TourneeForm';
import ChargementForm from '../forms/ChargementForm';
import TricycleForm from '../forms/TricycleForm';
import { Truck } from 'lucide-react';

const STATUT_COLORS = {
  PLANIFIEE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  OUVERTE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  EN_COURS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CLOTURE_COMMERCIALE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  TERMINEE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  VALIDEE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ANNULEE: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const LIMIT = 100;

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous.';
  if (status === 403) return 'Vous n’avez pas accès à ce dépôt ou à cette fonctionnalité.';
  if (status === 404) return 'La ressource demandée est introuvable.';
  if (status === 422) return 'Les données envoyées sont invalides.';
  if (status >= 500) return 'Le serveur rencontre un problème. Réessayez plus tard.';
  if (!err?.response) return 'Impossible de joindre le serveur.';
  return err?.response?.data?.message || err?.message || 'Une erreur est survenue.';
}

export default function TourneesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('tournees');
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;

  const [selectedTournee, setSelectedTournee] = useState(null);
  const [recap, setRecap] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [chargementOpen, setChargementOpen] = useState(false);
  const [chargementTourneeId, setChargementTourneeId] = useState(null);
  const [tricycleFormOpen, setTricycleFormOpen] = useState(false);
  const [tricycleEditItem, setTricycleEditItem] = useState(null);
  const [search, setSearch] = useState('');

  const { data: tourneesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['depot-tournees', depotId],
    queryFn: async () => {
      const res = await depotApi.getTournees({ page: 1, limit: LIMIT, depotId });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId),
  });

  const tournees = Array.isArray(tourneesData) ? tourneesData : (tourneesData?.data || []);
  const filtres = tournees.filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return [
      item.reference,
      item.commercial?.nom,
      item.commercial?.email,
      item.tricycle?.nom,
      item.tricycle?.immatriculation,
      item.statut,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
  });

  const pagination = usePagination(filtres, 10);
  const { currentPage, setCurrentPage, nextPage, prevPage, totalPages, totalItems, paginatedData: paginated } = pagination;

  const invalidateTournees = () => {
    queryClient.invalidateQueries({ queryKey: ['depot-tournees', depotId] });
    queryClient.invalidateQueries({ queryKey: ['depot-tricycles', depotId] });
    queryClient.invalidateQueries({ queryKey: ['depot-dashboard', depotId] });
  };

  const demarrerMutation = useMutation({
    mutationFn: (id) => depotApi.demarrerTournee(id, depotId),
    onSuccess: () => { invalidateTournees(); notif.success('Tournée démarrée'); },
    onError: (err) => notif.error(getErrorMessage(err)),
  });

  const cloturerMutation = useMutation({
    mutationFn: ({ id, montant }) => depotApi.cloturerTournee(id, { montant, depotId }),
    onSuccess: () => { invalidateTournees(); notif.success('Tournée clôturée avec succès'); },
    onError: (err) => notif.error(getErrorMessage(err)),
  });

  const handleDemarrer = (id) => {
    if (!depotId || demarrerMutation.isPending) return;
    demarrerMutation.mutate(id);
  };

  const handleCloturer = (id) => {
    if (!depotId || cloturerMutation.isPending) return;
    const raw = window.prompt('Montant total remis par le commercial :');
    if (raw === null || raw.trim() === '') return;
    const montant = Number(raw);
    if (!Number.isFinite(montant) || montant < 0) {
      notif.error('Le montant doit être un nombre supérieur ou égal à 0.');
      return;
    }
    cloturerMutation.mutate({ id, montant });
  };

  const handleCharger = (id) => {
    if (!depotId) return;
    setChargementTourneeId(id);
    setChargementOpen(true);
  };

  const handleVoirRecap = async (id) => {
    if (!depotId) return;
    try {
      const res = await depotApi.getRecapTournee(id, depotId);
      setRecap(res.data);
      setSelectedTournee(id);
    } catch (err) {
      notif.error(getErrorMessage(err));
    }
  };

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-amber-400 font-bold">Dépôt non sélectionné</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tournées</h1>
          <p className="text-slate-400 text-sm mt-1">Planification et suivi des tournées tricycle ({tournees.length} tournée{tournees.length > 1 ? 's' : ''})</p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => { setTricycleEditItem(null); setTricycleFormOpen(true); }} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm">Nouveau tricycle</button>
            <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Nouvelle tournée</button>
          </div>
        )}
      </div>

      <input
        type="search"
        placeholder="Rechercher par référence, commercial, tricycle ou statut…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500"
      />

      {isError ? (
        <div className="p-8 text-center bg-red-500/5 border border-red-500/20 rounded-xl">
          <p className="text-red-300 font-semibold">{getErrorMessage(error)}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm">Réessayer</button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-36 bg-slate-800/60 rounded-xl animate-pulse" />)}</div>
      ) : totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <Truck className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p className="text-lg font-medium">{search ? 'Aucune tournée trouvée' : 'Aucune tournée planifiée'}</p>
          <p className="text-sm mt-1">{search ? 'Modifiez votre recherche.' : 'Créez votre première tournée.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((t) => {
            const status = t.statut || 'PLANIFIEE';
            const label = status === 'OUVERTE' ? 'EN COURS' : status.replaceAll('_', ' ');
            return (
              <div key={t.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div>
                      <p className="text-white font-bold">{t.reference || t.commercial?.nom || 'Tournée'}</p>
                      <p className="text-xs text-slate-500">{t.tricycle?.immatriculation || t.tricycle?.nom || 'Tricycle'}</p>
                      <p className="text-xs text-slate-500">{t.commercial?.nom || t.commercial?.email || 'Commercial'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUT_COLORS[status] || STATUT_COLORS.PLANIFIEE}`}>{label}</span>
                  </div>
                  <p className="text-xs text-slate-400">{t.date ? new Date(t.date).toLocaleString('fr-FR') : t.dateOuverture ? new Date(t.dateOuverture).toLocaleString('fr-FR') : '-'}</p>
                  {t.notes && <p className="text-xs text-slate-500 mt-3 italic">{t.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {canWrite && status === 'PLANIFIEE' && <button onClick={() => handleDemarrer(t.id)} disabled={demarrerMutation.isPending} className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] disabled:opacity-50">{demarrerMutation.isPending ? 'Démarrage…' : 'Démarrer'}</button>}
                  {canWrite && status === 'PLANIFIEE' && <button onClick={() => handleCharger(t.id)} className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px]">Charger</button>}
                  {canWrite && status === 'OUVERTE' && <button onClick={() => handleCloturer(t.id)} disabled={cloturerMutation.isPending} className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] disabled:opacity-50">{cloturerMutation.isPending ? 'Clôture…' : 'Clôturer'}</button>}
                  {(status === 'CLOTURE_COMMERCIALE' || status === 'TERMINEE' || status === 'VALIDEE') && <button onClick={() => handleVoirRecap(t.id)} className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px]">Récapitulatif</button>}
                  {canWrite && status === 'PLANIFIEE' && <button onClick={() => { setEditItem(t); setFormOpen(true); }} className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px]">Modifier</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-6"><button disabled={currentPage <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Précédent</button><span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span><button disabled={currentPage >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Suivant</button></div>}

      {recap && selectedTournee && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setRecap(null); setSelectedTournee(null); }}><div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-lg font-black text-white mb-4">Récapitulatif tournée</h2><div className="space-y-3"><div className="flex justify-between p-3 bg-slate-800 rounded-xl"><span className="text-slate-400">Articles chargés</span><span className="text-white font-bold">{recap.articlesCharges || 0}</span></div><div className="flex justify-between p-3 bg-slate-800 rounded-xl"><span className="text-slate-400">Articles vendus</span><span className="text-emerald-400 font-bold">{recap.articlesVendus || 0}</span></div><div className="flex justify-between p-3 bg-slate-800 rounded-xl"><span className="text-slate-400">Retours</span><span className="text-orange-400 font-bold">{recap.retours || 0}</span></div><div className="flex justify-between p-3 bg-slate-800 rounded-xl"><span className="text-slate-400">Montant total</span><span className="text-white font-bold text-lg">{(recap.montant || 0).toLocaleString('fr-FR')} FCFA</span></div></div><button onClick={() => { setRecap(null); setSelectedTournee(null); }} className="w-full mt-6 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl">Fermer</button></div></div>}

      <TourneeForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} depotId={depotId} />
      <ChargementForm isOpen={chargementOpen} onClose={() => { setChargementOpen(false); setChargementTourneeId(null); }} metier="depot-boissons" tourneeId={chargementTourneeId} depotId={depotId} />
      <TricycleForm isOpen={tricycleFormOpen} onClose={() => setTricycleFormOpen(false)} edit={tricycleEditItem} depotId={depotId} />
    </div>
  );
}
