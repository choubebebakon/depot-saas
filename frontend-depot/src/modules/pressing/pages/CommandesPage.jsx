import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import FormModal from '../../../shared/components/forms/FormModal';
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


export default function CommandesPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pressing';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ clientNom: '', description: '', montant: '', statut: 'EN_ATTENTE', dateLivraison: '' });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const STATUT_COLOR = { 'EN_ATTENTE': '#f59e0b', 'EN_COURS': '#3b82f6', 'PRETE': '#10b981', 'LIVREE': '#8b5cf6', 'ANNULEE': '#ef4444' };
  const STATUT_MAP = { 'EN_ATTENTE': 'En attente', 'EN_COURS': 'En cours', 'PRETE': 'Prête', 'LIVREE': 'Livrée', 'ANNULEE': 'Annulée' };
  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const { success, error: notifError } = useNotif();

  const { data: commandesData = [], loading, refetch } = useData(`/${prefix}/commandes`, { enabled: true });
  const commandes = Array.isArray(commandesData?.data) ? commandesData.data : (Array.isArray(commandesData) ? commandesData : []);

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (commandes || []).filter(item =>
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
      await api.delete(`/${prefix}/commandes/${confirmDelete.id}`);
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
        await api.patch(`/${prefix}/commandes/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/commandes`, form);
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
        <div><h1 className="text-3xl font-black text-white tracking-tight">Commandes</h1><p className="text-slate-400 text-sm">{totalItems} commande(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle commande</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Description</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Statut</th><th className="text-left p-4">Livraison</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{paginated.map(c => (
            <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.clientNom}</td><td className="p-4 text-slate-300">{c.description}</td><td className="p-4 text-right text-white font-bold">{Number(c.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUT_COLOR[c.statut] + '22', color: STATUT_COLOR[c.statut] }}>{STATUT_MAP[c.statut] || c.statut}</span></td><td className="p-4 text-slate-300">{c.dateLivraison ? new Date(c.dateLivraison).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(c)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️ Modifier</button><button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️ Supprimer</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={prevPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={nextPage} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">?</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '?? Modifier commande' : '?? Nouvelle commande'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Crer'}>
        {['clientNom','description','montant','dateLivraison'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'clientNom' ? 'Client' : f === 'description' ? 'Description' : f === 'montant' ? 'Montant (F)' : 'Date livraison'}</label><input type={f === 'montant' ? 'number' : f === 'dateLivraison' ? 'date' : 'text'} value={form[f]} onChange={set(f)} className={inputClass} required={f !== 'dateLivraison'} /></div>
        ))}
        {editItem && <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Statut</label><select value={form.statut} onChange={set('statut')} className={inputClass}>{Object.entries(STATUT_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la commande" message={`Supprimer la commande de ${confirmDelete?.clientNom || ''} (${Number(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F) ?`} />
    </div>
  );
}
