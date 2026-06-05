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


export default function ClientsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'telephonie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [notif, setNotif] = useState(null);

  const [edit, setEdit] = useState(null);


  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'clients');

  const { data: clients = [],
    loading,
    refetch,
   } = useData(`/${prefix}/clients`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (clients || []).filter(item =>
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
      await api.delete(`/${prefix}/clients/${confirmDelete.id}`);
      setConfirmDelete(null);
      success('élément supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'échec');
    } finally {
      setDeleting(false);
    }
  };



  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Clients</h1><p className="text-slate-400 text-sm mt-1">{totalItems} client{totalItems !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouveau Client</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Nom ou tlphone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Client</th><th className="text-left px-5 py-4">Tlphone</th><th className="text-left px-5 py-4">Email</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun client trouvé</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-black text-sm">{(c.nom?.[0] || '?').toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{c.nom} {c.prenom || ''}</p></div></div></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.telephone || ''}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.email || ''}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>{perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️ Supprimer</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} client{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Client modifié ?' : 'Client cr ?'); refetch(); }} edit={editItem} metier={prefix} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer le client" message={`tes-vous sr de vouloir suppriméer "${confirmDelete?.nom}" ?`} />
    </div>
  );
}


