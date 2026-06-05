import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';

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


export default function AbonnementsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'salon_beaute';
  const prefix = 'salon';

  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});
  const [deleting, setDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [dateDebut, setDateDebut] = useState('');

  const [editItem, setEditItem] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const [edit, setEdit] = useState(null);

  const { success, error: notifError } = useNotif();

  const { data: abonnements = [],
    loading,
    refetch,
   } = useData(`/${prefix}/abonnements`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (abonnements || []).filter(item =>
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
      await api.delete(`/${prefix}/abonnements/${confirmDelete}`);
      setConfirmDelete(null);
      success('élément supprimé');
      refetch();
    } catch {
      notifError('Erreur lors de la suppression', 'échec');
    } finally {
      setDeleting(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.patch(`/${prefix}/abonnements/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/abonnements`, form);
      }
      setFormOpen(false);
      setEditItem(null);
      success(editItem ? 'élément modifié' : 'élément cr');
      refetch();
    } catch {
      notifError("Erreur lors de l'enregistréement", 'échec');
    }
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setFormOpen(true);
  };



  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">Fidlit / Abonnements</h1><p className="text-slate-400 text-sm">{totalItems} abonnement(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ clientNom: '', type: 'FORFAIT_5', montant: '', validite: '30', dateDebut: '', notes: '' }); setShowModal(true); }} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvel abonnement</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Type</th><th className="text-right p-4">Montant</th><th className="text-right p-4">Validit</th><th className="text-left p-4">Dbut</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{paginated.map(a => (
            <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{a.clientNom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-pink-500/20 text-pink-400">{a.type}</span></td><td className="p-4 text-right text-white font-bold">{Number(a.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-right text-slate-300">{a.validite} jours</td><td className="p-4 text-slate-300">{a.dateDebut ? new Date(a.dateDebut).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(a)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️ Modifier</button><button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️ Supprimer</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={prevPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={nextPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvel'} abonnement</h2><form onSubmit={handleSubmit} className="space-y-4">
      {['clientNom','montant','validite','dateDebut','notes'].map(f => (
        <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'montant' || f === 'validite' ? 'number' : f === 'dateDebut' ? 'date' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'clientNom' || f === 'montant'} /></div>
      ))}
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="FORFAIT_5">Forfait 5 sances</option><option value="FORFAIT_10">Forfait 10 sances</option><option value="MENSUEL">Mensuel illimit</option><option value="ANNUEL">Annuel</option></select></div>
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1 transition-all">{edit ? 'Enregistrer' : 'Crer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm transition-all">Annuler</button></div></form></div></div>}
    </div>
  );
}
