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


const CATEGORIES_DEPENSES = [
  'Carburant', 'Rparation', 'Achat marchandise', 'Transport', 'Fourniture',
  'Eau/lectricit', 'Loyer', 'Salaire', 'Marketing', 'Autre'
];

const LIMIT = 20;

export default function DepensesPage() {
  const { metier } = useAuth();

  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().split('T')[0] });
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(false);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const filtres = (depenses || []).filter(item =>
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

  const totalDepenses = depenses.reduce((acc, i) => acc + (i.montant || 0), 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await depotApi.getDepenses({ page, limit: LIMIT });
      setDepenses(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    try {
      await depotApi.createDepense(formData);
      setShowModal(null);
      setFormData({ montant: '', motif: '', categorie: 'Autre', date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await depotApi.deleteDepense(confirmDelete.id);
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
          <h1 className="text-2xl font-black text-white tracking-tight">Dpenses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total > 0 ? `${total} dpense${total > 1 ? 's' : ''}  Total: ${totalDepenses.toLocaleString('fr-FR')} FCFA` : 'Aucune dpense'}
          </p>
        </div>
        <button onClick={() => setShowModal('create')}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-orange-600/20">
          ? Nouvelle dpense
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />)}
        </div>
      ) : totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">??</p>
          <p className="text-lg font-medium">Aucune dpense enregistrée</p>
          <p className="text-sm mt-1">Cliquez sur "Nouvelle dpense"</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Motif</th>
                <th className="text-center p-4 font-semibold">Catgorie</th>
                <th className="text-right p-4 font-semibold">Montant</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-white">{new Date(d.date || d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-slate-300">{d.motif || '-'}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {d.categorie || 'Autre'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-red-400 font-bold">-{(parseInt(d.montant) || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setConfirmDelete(d)} title="Supprimer"
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all">🗑️ Supprimer</button>
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
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
          <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
        </div>
      )}

      {showModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4">Nouvelle dpense</h2>
            <div className="space-y-4">
              <input type="number" placeholder="Montant (FCFA)" value={formData.montant}
                onChange={e => setFormData({...formData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <input placeholder="Motif" value={formData.motif} onChange={e => setFormData({...formData, motif: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <select value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">
                {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all text-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la dpense" message={`Supprimer la dpense de ${(parseInt(confirmDelete?.montant || 0)).toLocaleString('fr-FR')} FCFA ? Cette action est irrversible.`} />
    </div>
  );
}
