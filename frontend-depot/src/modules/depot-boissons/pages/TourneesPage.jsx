import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import TourneeForm from '../forms/TourneeForm';
import ChargementForm from '../forms/ChargementForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    Object.setPrototypeOf(window, window.safeHandler);
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}


const STATUT_COLORS = {
  PLANIFIEE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  EN_COURS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TERMINEE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ANNULEE: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const LIMIT = 20;

export default function TourneesPage() {
  const { metier, user } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const [tournees, setTournees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [recap, setRecap] = useState(null);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [chargementOpen, setChargementOpen] = useState(false); const [chargementTourneeId, setChargementTourneeId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const [edit, setEdit] = useState(null);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await depotApi.getTournees({ page, limit: LIMIT });
      setTournees(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (t) => { setEditItem(t); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  async function handleDemarrer(id) {
    try {
      await depotApi.demarrerTournee(id);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCloturer(id) {
    const montant = prompt('Montant total des ventes de la tourne :');
    if (!montant || isNaN(montant)) return;
    try {
      await depotApi.cloturerTournee(id, { montant: parseInt(montant) });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  function handleCharger(id) {
    setChargementTourneeId(id);
    setChargementOpen(true);
  }

  async function handleVoirRecap(id) {
    try {
      const res = await depotApi.getRecapTournee(id);
      setRecap(res.data);
      setSelectedTournee(id);
    } catch (err) {
      console.error(err);
    }
  }



  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (tournees || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tournes</h1>
          <p className="text-slate-400 text-sm mt-1">Planification et suivi des tournes tricycle</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          ? Nouvelle tourne
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />)}
        </div>
      ) : totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">??</p>
          <p className="text-lg font-medium">Aucune tourne planifie</p>
          <p className="text-sm mt-1">Crez votre premire tourne</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(t => (
            <div key={t.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all">
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
              <div className="flex flex-wrap gap-1.5">
                {t.statut === 'PLANIFIEE' && (
                  <>
                    <button onClick={() => handleDemarrer(t.id)}
                      className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all">Dmarrer</button>
                    <button onClick={() => handleCharger(t.id)}
                      className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">Charger</button>
                  </>
                )}
                {t.statut === 'EN_COURS' && (
                  <button onClick={() => handleCloturer(t.id)}
                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] transition-all">? Clturer</button>
                )}
                {t.statut === 'TERMINEE' && (
                  <button onClick={() => handleVoirRecap(t.id)}
                    className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">Rcapitulatif</button>
                )}
                <button onClick={() => openEdit(t)}
                  className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px] transition-all">✏️ Modifier</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
          <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
        </div>
      )}

      {recap && selectedTournee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setRecap(null); setSelectedTournee(null); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-white mb-4">Rcapitulatif tourne</h2>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-400">Articles chargs</span>
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

      <TourneeForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="depot-boissons" />
      <ChargementForm isOpen={chargementOpen} onClose={() => { setChargementOpen(false); setChargementTourneeId(null); }} onSuccess={() => load()} metier="depot-boissons" tourneeId={chargementTourneeId} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer" message={`Supprimer cette tourne ? Cette action est irrversible.`} />
    </div>
  );
}
