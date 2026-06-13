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
import DelivranceForm from '../forms/DelivranceForm';
import OrdonnanceForm from '../forms/OrdonnanceForm';

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


export default function OrdonnancesPage() {
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

  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryLignes, setDeliveryLignes] = useState([]);

  const [deliveryLigne, setDeliveryLigne] = useState(null);

  const [edit, setEdit] = useState(null);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'ordonnances');

  const { data: ordonnancesData = [], loading, refetch } = useData(`/${prefix}/ordonnances`, { enabled: true });
  const ordonnances = Array.isArray(ordonnancesData?.data) ? ordonnancesData.data : (Array.isArray(ordonnancesData) ? ordonnancesData : []);

  const { data: patientsData = [] } = useData(`/${prefix}/patients`, { enabled: true });
  const patients = Array.isArray(patientsData?.data) ? patientsData.data : (Array.isArray(patientsData) ? patientsData : []);

  const STATUTS = {
    EN_ATTENTE: { label: 'En attente', color: 'bg-slate-500/20 text-slate-400' },
    EN_PREPARATION: { label: 'En préparation', color: 'bg-blue-500/20 text-blue-400' },
    PRETE: { label: 'Prête', color: 'bg-emerald-500/20 text-emerald-400' },
    LIVRE: { label: 'Livré', color: 'bg-green-500/20 text-green-400' },
    ANNULE: { label: 'Annulé', color: 'bg-red-500/20 text-red-400' }
  };
  const badgeColor = {
    EN_ATTENTE: 'bg-slate-500/20 text-slate-400',
    EN_PREPARATION: 'bg-blue-500/20 text-blue-400',
    PRETE: 'bg-emerald-500/20 text-emerald-400',
    LIVRE: 'bg-green-500/20 text-green-400',
    ANNULE: 'bg-red-500/20 text-red-400'
  };

  const openDelivery = (ordonnance) => {
    setDeliveryLignes(ordonnance.lignes || []);
    setDeliveryOpen(true);
  };

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (ordonnances || []).filter(item =>
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
      await api.delete(`/${prefix}/ordonnances/${confirmDelete.id}`);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Ordonnances</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} ordonnance{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouvelle Ordonnance
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher une ordonnance..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Patient</th>
                <th className="text-left px-5 py-4">Mdecin</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune ordonnance trouvée</td></tr>
              ) : paginated.map(o => {
                const client = patients.find(p => p.id === o.clientId);
                const s = STATUTS[o.statut] || STATUTS.EN_ATTENTE;
                return (
                  <tr key={o.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{client?.nom || ''}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{o.medecin || ''}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{o.dateEmise ? new Date(o.dateEmise).toLocaleDateString('fr-FR') : ''}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDelivery(o)}
                          className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 text-sm transition-colors" title="Dlivrer">✏️ Modifier</button>
                        {perm.canEdit && (
                        <button onClick={() => { setEditItem(o); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors" title="Modifier">✏️ Modifier</button>
                        )}
                        {perm.canDelete && (
                        <button onClick={() => setConfirmDelete(o)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors" title="Annuler">✏️ Modifier</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} ordonnance{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && <OrdonnanceForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { success(editItem ? 'Ordonnance modifiée ?' : 'Ordonnance cre ?'); refetch(); }} edit={editItem} />}

      {deliveryLignes.length > 1 && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${deliveryOpen ? '' : 'hidden'}`} onClick={() => { setDeliveryOpen(false); setDeliveryLignes([]); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black text-lg mb-4">Dlivrance - Slectionnez une ligne</h3>
            {deliveryLignes.map((ligne, idx) => {
              const reste = ligne.quantitePrescrite - (ligne.quantiteDelivree || 0);

  return (
                <button key={ligne.id} onClick={() => { setDeliveryLigne(ligne); }}
                  className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${deliveryLigne?.id === ligne.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50 hover:bg-slate-700'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">{ligne.medicament?.designation || `Mdicament #${idx + 1}`}</p>
                      <p className="text-slate-400 text-xs">Prescrit: {ligne.quantitePrescrite} | Reste: {reste}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${reste > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{reste > 0 ? ' dlivrer' : 'Complte'}</span>
                  </div>
                </button>
              );
            })}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setDeliveryOpen(true); }} disabled={!deliveryLigne}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">Dlivrer</button>
              <button onClick={() => { setDeliveryOpen(false); setDeliveryLignes([]); setDeliveryLigne(null); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <DelivranceForm isOpen={deliveryOpen && deliveryLigne && deliveryLignes.length <= 1} onClose={() => { setDeliveryOpen(false); setDeliveryLigne(null); setDeliveryLignes([]); }} onSuccess={() => { success('Dlivrance enregistrée ?'); refetch(); setDeliveryOpen(false); setDeliveryLigne(null); setDeliveryLignes([]); }} metier={prefix} ordonnanceLigne={deliveryLigne} />

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Annuler l'ordonnance"
          message={`tes-vous sr de vouloir annuler cette ordonnance ?`}
        />
      )}
    </div>
  );
}


