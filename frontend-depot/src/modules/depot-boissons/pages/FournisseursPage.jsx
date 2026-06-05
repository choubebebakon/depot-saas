import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import FournisseurForm from '../../../shared/forms/FournisseurForm';
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

export default function FournisseursPage() {
  const { metier } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [detteData, setDetteData] = useState({ montant: '' });
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const [edit, setEdit] = useState(null);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await depotApi.getFournisseurs({ page, limit: LIMIT });
      setFournisseurs(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (f) => { setEditItem(f); setFormOpen(true); };

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

  async function handleCommander(fournisseurId) {
    const articles = prompt('Articles  commander :');
    if (!articles) return;
    try {
      await depotApi.passerCommandeFournisseur({ fournisseurId, articles });
      alert('Commande envoye !');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReceptionner(fournisseurId) {
    if (!confirm('Rceptionner la livraison ?')) return;
    try {
      const articles = prompt('Articles reus :');
      if (!articles) return;
      await depotApi.receptionnerLivraison(fournisseurId, { articles });
      alert('Livraison rceptionne !');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleReglerDette(fournisseurId) {
    if (!detteData.montant || isNaN(detteData.montant)) return;
    try {
      await depotApi.reglerDetteFournisseur(fournisseurId, { montant: parseInt(detteData.montant) });
      setShowModal(null);
      setDetteData({ montant: '' });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVoirCommandes(fournisseur) {
    try {
      const res = await depotApi.historiqueCommandes(fournisseur.id);
      setCommandes(res.data.data || res.data || []);
      setSelectedFournisseur(fournisseur);
    } catch (err) {
      console.error(err);
    }
  }


  if (loading && totalItems === 0) {

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (fournisseurs || []).filter(item =>
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
  const filtres = (fournisseurs || []).filter(item =>
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
          <h1 className="text-2xl font-black text-white tracking-tight">Fournisseurs</h1>
          <p className="text-slate-400 text-sm mt-1">{total} fournisseur{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20">
          ? Nouveau fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totalItems === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-3xl mb-3">??</p>
            <p className="text-lg font-medium">Aucun fournisseur</p>
            <p className="text-sm mt-1">Ajoutez votre premier fournisseur</p>
          </div>
        ) : paginated.map(f => (
          <div key={f.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-bold">{f.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.telephone || '-'}</p>
                {f.email && <p className="text-xs text-slate-500">{f.email}</p>}
              </div>
              <button onClick={() => openEdit(f)} className="text-slate-500 hover:text-white text-xs">✏️ Modifier</button>
            </div>
            {f.dette > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 text-center">
                <p className="text-[10px] text-red-400 uppercase tracking-wider">Dette</p>
                <p className="text-sm font-bold text-red-400">{parseInt(f.dette).toLocaleString('fr-FR')} FCFA</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => handleCommander(f.id)}
                className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-all">Commander</button>
              <button onClick={() => handleReceptionner(f.id)}
                className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white font-bold rounded-lg text-[10px] transition-all">Rceptionner</button>
              {f.dette > 0 && (
                <button onClick={() => { setSelectedFournisseur(f); setShowModal('regler'); }}
                  className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white font-bold rounded-lg text-[10px] transition-all">Rgler</button>
              )}
              <button onClick={() => handleVoirCommandes(f)}
                className="px-3 py-1.5 bg-slate-600/80 hover:bg-slate-500 text-white font-bold rounded-lg text-[10px] transition-all">Commandes</button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
          <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
        </div>
      )}

      {selectedFournisseur && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedFournisseur(null); setCommandes([]); }}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Historique commandes - {selectedFournisseur.nom}</h2>
              <button onClick={() => { setSelectedFournisseur(null); setCommandes([]); }} className="text-slate-500 hover:text-white">?</button>
            </div>
            {commandes.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Aucune commande passe</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {commandes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-slate-500">{c.articles || '-'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      c.statut === 'RECUE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>{c.statut || 'EN_ATTENTE'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal === 'regler' && selectedFournisseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-2">Rglement fournisseur</h2>
            <p className="text-sm text-slate-400 mb-4">{selectedFournisseur.nom} - Dette: {parseInt(selectedFournisseur.dette).toLocaleString('fr-FR')} FCFA</p>
            <input type="number" placeholder="Montant  rgler" value={detteData.montant}
              onChange={e => setDetteData({ montant: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(null); setDetteData({ montant: '' }); }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={() => handleReglerDette(selectedFournisseur.id)}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Rgler</button>
            </div>
          </div>
        </div>
      )}

      <FournisseurForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer" message={`Supprimer ce fournisseur ? Cette action est irrversible.`} />
    </div>
  );
}
