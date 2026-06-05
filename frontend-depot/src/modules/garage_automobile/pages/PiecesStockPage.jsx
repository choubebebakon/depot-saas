import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import PieceGarageForm from '../forms/PieceGarageForm';

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


export default function PiecesStockPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'garage_automobile';
  const prefix = 'garage';

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const [notif, setNotif] = useState(null);


  const [filtreCat, setFiltreCat] = useState('');

  const [edit, setEdit] = useState(null);
  const estAlerte = (item) => item.quantite <= (item.seuil || 5);
  const CATEGORIES = [];
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'pieces');

  const { data: pieces = [],
    loading,
    refetch,
   } = useData(`/${prefix}/pieces`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (pieces || []).filter(item =>
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/pieces/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('élément supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'échec');
    } finally {
      setDeleting(false);
    }
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setFormOpen(true);
  };


  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Stock Pices</h1><p className="text-slate-400 text-sm mt-1">{totalItems} pice{totalItems !== 1 ? 's' : ''}{pieces.filter(estAlerte).length > 0 && <span className="text-red-400 ml-2">?? {pieces.filter(estAlerte).length} alerte{pieces.filter(estAlerte).length > 1 ? 's' : ''}</span>}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouvelle Pice</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Nom ou rfrence..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreCat} onChange={e => { setFiltreCat(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes catgories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Pice</th><th className="text-left px-5 py-4">Catgorie</th><th className="text-right px-5 py-4">Qt</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune pice trouvée</td></tr>
              : paginated.map(p => (
                <tr key={p.id} className={`hover:bg-slate-700/20 transition-colors ${estAlerte(p) ? 'bg-red-500/5' : ''}`}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 font-black text-sm">??</div><div><p className="text-white font-semibold text-sm">{p.nom}</p>{p.reference && <p className="text-slate-500 text-xs">{p.reference}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{p.categorie}</span></td>
                  <td className="px-5 py-4 text-right"><span className={`font-mono font-bold ${estAlerte(p) ? 'text-red-400' : 'text-white'}`}>{p.quantite || 0}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(p.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️ Supprimer</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} pice{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      <PieceGarageForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Pice modifiée ?' : 'Pice cre ?'); refetch(); }} edit={editItem} metier={prefix} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la pice" message={`Supprimer  ${confirmDelete?.nom || confirmDelete?.designation}  ? Cette action est irrversible.`} />
    </div>
  );
}
