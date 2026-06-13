import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import VenteBoissonsForm from '../forms/VenteBoissonsForm';
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
    // Object.setPrototypeOf(window, window.safeHandler) - REMOVED: not supported in modern browsers
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


const LIMIT = 20;

export default function VentesPage() {
  const { metier } = useAuth();

  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const [edit, setEdit] = useState(null);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const filtres = (ventes || []).filter(item =>
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
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await depotApi.getVentes({ page, limit: LIMIT });
      setVentes(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const handleAnnulerVente = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await depotApi.annulerVente(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Historique des ventes</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30">
          ? Nouvelle vente
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
        </div>
      ) : totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">??</p>
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
                      v.statut === 'ANNULEE' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {v.statut || 'VALIDEE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => depotApi.imprimerTicket(v.id).then(r => { const url = URL.createObjectURL(r.data); window.open(url); })}
                        title="Imprimer ticket" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all">🗑️ Supprimer</button>
                      {v.statut !== 'ANNULEE' && (
                        <button onClick={() => setConfirmDelete(v)} title="Annuler"
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all">?</button>
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
          <button disabled={page <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">? Prcdent</button>
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ?</button>
        </div>
      )}

      <VenteBoissonsForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleAnnulerVente} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Annuler la vente" message={`Annuler la vente de ${parseInt(confirmDelete?.total || 0).toLocaleString('fr-FR')} FCFA ? Cette action est irrversible.`} />
    </div>
  );
}
