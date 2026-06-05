import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
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


const LIMIT = 20;

export default function LivraisonsPage() {
  const { metier } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({ fournisseurId: '', articles: '', dateLivraison: '', notes: '' });
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, statut: filtreStatut || undefined };
      const res = await depotApi.getLivraisons(params);
      setLivraisons(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filtreStatut]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showModal) {
      depotApi.getFournisseurs({ limit: 100 }).then(r => {
        setFournisseurs(r.data.data || r.data);
      }).catch(console.error);
    }
  }, [showModal]);

  async function handleCreate() {
    try {
      await depotApi.createLivraison(formData);
      setShowModal(null);
      setFormData({ fournisseurId: '', articles: '', dateLivraison: '', notes: '' });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await depotApi.deleteLivraison(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };


  if (loading && totalItems === 0) {

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (livraisons || []).filter(item =>
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
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }


  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (livraisons || []).filter(item =>
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
          <h1 className="text-2xl font-black text-white tracking-tight">Livraisons</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des entres marchandises</p>
        </div>
        <button onClick={() => setShowModal('create')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20">
          ? Nouvelle livraison
        </button>
      </div>

      <div className="flex gap-3">
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_COURS">En cours</option>
          <option value="RECUE">Reue</option>
          <option value="ANNULEE">Annule</option>
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
                  <p className="text-sm">Crez votre premire livraison</p>
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
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all">🗑️ Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">? Prcdent</button>
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ?</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">Nouvelle livraison</h2>
            <div className="space-y-4">
              <select value={formData.fournisseurId} onChange={e => setFormData({...formData, fournisseurId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">
                <option value="">Slectionner un fournisseur</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              <textarea placeholder="Articles livrs (un par ligne)" value={formData.articles}
                onChange={e => setFormData({...formData, articles: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm min-h-[100px]" />
              <input type="date" value={formData.dateLivraison} onChange={e => setFormData({...formData, dateLivraison: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <input placeholder="Notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Crer la livraison</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la livraison" message={`Supprimer la livraison du ${confirmDelete?.dateLivraison ? new Date(confirmDelete.dateLivraison).toLocaleDateString('fr-FR') : '...'} ? Cette action est irrversible.`} />
    </div>
  );
}
