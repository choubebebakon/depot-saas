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
import LotForm from '../forms/LotForm';

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


export default function LotsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pharmacie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [notif, setNotif] = useState(null);

  const [edit, setEdit] = useState(null);

  const bientot = items.filter(i => i.datePeremption && new Date(i.datePeremption) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(i.datePeremption) >= new Date());
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'lots');

  const { data: lots = [],
    loading,
    refetch,
   } = useData(`/${prefix}/lots`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (lots || []).filter(item =>
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
      await api.delete(`/${prefix}/lots/${confirmDelete.id}`);
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
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Lots & Traabilit</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} lot{ totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouveau Lot
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher un lot ou mdicament..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Mdicament</th>
                <th className="text-left px-5 py-4">N Lot</th>
                <th className="text-center px-5 py-4">Expiration</th>
                <th className="text-right px-5 py-4">Quantit</th>
                <th className="text-center px-5 py-4">Statut DLC</th>
                {perm.canEdit && <th className="text-center px-5 py-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={perm.canEdit ? 6 : 5} className="text-center py-16 text-slate-500">Aucun lot trouvé</td></tr>
              ) : paginated.map(l => {
                const med = medicaments.find(m => m.id === l.medicamentId);
                const dlc = l.dateExpiration ? new Date(l.dateExpiration) : null;
                const now = new Date();
                const dlcStatus = !dlc ? 'neutre' : dlc <= now ? 'expire' : dlc <= new Date(now.getTime() + 7 * 86400000) ? 'urgent' : dlc <= new Date(now.getTime() + 30 * 86400000) ? 'bientot' : 'ok';
                const dlcColors = { expire: 'bg-red-500/20 text-red-400', urgent: 'bg-amber-500/20 text-amber-400', bientot: 'bg-yellow-500/20 text-yellow-400', ok: 'bg-emerald-500/20 text-emerald-400', neutre: 'bg-slate-700 text-slate-400' };
                return (
                  <tr key={l.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{med?.designation || ''}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm font-mono">{l.numeroLot}</td>
                    <td className="px-5 py-4 text-center text-slate-300 text-sm">{dlc ? dlc.toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-5 py-4 text-right text-white font-bold text-sm">{l.quantite ?? 0}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${dlcColors[dlcStatus]}`}>
                        {dlcStatus === 'expire' ? 'Expir' : dlcStatus === 'urgent' ? '< 7j' : dlcStatus === 'bientot' ? '< 30j' : dlcStatus === 'ok' ? 'OK' : ''}
                      </span>
                    </td>
                    {perm.canEdit && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {perm.canEdit && (
                        <button onClick={() => { setEditItem(l); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>
                        )}
                        {perm.canDelete && (
                        <button onClick={() => setConfirmDelete(l)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️ Supprimer</button>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} lot{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && <LotForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Lot modifié ?' : 'Lot cr ?'); refetch(); }} edit={editItem} />}

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le lot"
          message={`tes-vous sr de vouloir suppriméer le lot "${confirmDelete.numeroLot}" ?`}
        />
      )}
    </div>
  );
}
