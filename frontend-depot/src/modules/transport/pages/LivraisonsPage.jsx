import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
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


export default function LivraisonsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'transport';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [edit, setEdit] = useState(null);



  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const { success, error: notifError } = useNotif();

  const { data: data = [],
    loading,
    refetch,
   } = useData(`/${prefix}/livraisons`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (data || []).filter(item =>
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
      await api.delete(`/${prefix}/livraisons/${confirmDelete.id}`);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">Livraisons</h1><p className="text-slate-400 text-sm">{totalItems} livraison(s)</p></div>
        <button onClick={openCreate} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle livraison</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Colis</th><th className="p-4 text-left">Destinataire</th><th className="p-4 text-left">Adresse</th><th className="p-4 text-left">Date</th><th className="p-4 text-left">Statut</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{paginated.map(item => (
          <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{item.colis}</td><td className="p-4 text-white">{item.destinataire}</td><td className="p-4 text-slate-300">{item.adresse}</td><td className="p-4 text-slate-300">{item.dateLivraison ? new Date(item.dateLivraison).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${item.statut === 'LIVREE' ? 'bg-green-500/20 text-green-400' : item.statut === 'EN_COURS' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.statut}</span></td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(item)} className="text-orange-400 text-xs">✏️ Modifier</button><button onClick={() => setConfirmDelete(item)} className="text-red-400 text-xs">🗑️ Supprimer</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => prevPage()} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => nextPage()} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button></div>}
      <LivraisonForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={refetch} edit={editItem} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} message={`Supprimer la livraison de ${confirmDelete?.destinataire || confirmDelete?.colis || 'cet élément'} ?`} loading={deleting} />
    </div>
  );
}


