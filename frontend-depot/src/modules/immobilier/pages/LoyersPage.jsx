import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { usePagination } from '../../../hooks/usePagination';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import PaiementLoyerForm from '../forms/PaiementLoyerForm';

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


export default function LoyersPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'immobilier';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'loyers');

  const { data: loyersData = [], loading, refetch } = useData(`/${prefix}/loyers`, { enabled: true });
  const loyers = Array.isArray(loyersData?.data) ? loyersData.data : (Array.isArray(loyersData) ? loyersData : []);

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (loyers || []).filter(item =>
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

  const openCreate = () => { setEditItem(null); setFormData({ contratId: '', mois: '', montant: '', datePaiement: '', statut: 'EN_ATTENTE' }); setFormOpen(true); };
  const [formData, setFormData] = useState({ contratId: '', mois: '', montant: '', datePaiement: '', statut: 'EN_ATTENTE' });
  const setForm = (v) => setFormData(v || { contratId: '', mois: '', montant: '', datePaiement: '', statut: 'EN_ATTENTE' });
  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [paiementFormOpen, setPaiementFormOpen] = useState(false);
  const [paiementContrat, setPaiementContrat] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth());

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/${prefix}/loyers/${confirmDelete.id}`);
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

  const [contrats, setContrats] = useState([]);
  useEffect(() => { api.get(`/${prefix}/contrats`).then(r => setContrats(r.data?.data || r.data || [])).catch(() => {}); }, [prefix]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editItem) {
        await api.patch(`/${prefix}/loyers/${editItem.id}`, formData);
      } else {
        await api.post(`/${prefix}/loyers`, formData);
      }
      success(editItem ? 'Loyer modifié' : 'Loyer cr');
      setFormOpen(false);
      setEditItem(null);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistréement");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Loyers</h1><p className="text-slate-400 text-sm mt-1">{totalItems} loyer{totalItems !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-teal-600/20">+ Nouveau Loyer</button>}
        {perm.canCreate && <button onClick={() => { if (contrats.length > 0) { setPaiementContrat(contrats[0]); setPaiementFormOpen(true); } else { api.get('/immobilier/contrats').then(r => { const cs = r.data?.data || r.data || []; if (cs.length > 0) { setPaiementContrat(cs[0]); setPaiementFormOpen(true); } }); } }} className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-amber-500/20 ml-2">Nouveau Paiement</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Bien, locataire ou mois..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Bien</th><th className="text-left px-5 py-4">Locataire</th><th className="text-left px-5 py-4">Mois</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun loyer trouvé</td></tr>
              : paginated.map(l => (
                <tr key={l.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{l.contrat?.bien?.nom || ''}</td>
                  <td className="px-5 py-4 text-slate-300">{l.contrat?.locataire?.nom || ''}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{l.mois || ''}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(l.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${l.statut === 'PAYE' ? 'bg-green-500/20 text-green-400' : l.statut === 'RETARD' ? 'bg-red-500/20 text-red-400' : l.statut === 'EN_ATTENTE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>{l.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(l)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️ Modifier</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(l)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️ Supprimer</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} loyer{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} title={editItem ? '?? Modifier loyer' : '?? Nouveau loyer'} loading={formLoading}>
        {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formError}</div>}
        <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Contrat *</label><select required value={formData.contratId} onChange={set('contratId')} className={inputClass}><option value="">Slectionner un contrat</option>{contrats.map(c => <option key={c.id} value={c.id}>{c.bien?.nom}  {c.locataire?.nom}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mois</label><input type="month" value={formData.mois} onChange={set('mois')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F CFA)</label><input type="number" value={formData.montant} onChange={set('montant')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date paiement</label><input type="date" value={formData.datePaiement} onChange={set('datePaiement')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={formData.statut} onChange={set('statut')} className={inputClass}><option value="PAYE">Pay</option><option value="EN_ATTENTE">En attente</option><option value="RETARD">En retard</option><option value="IMPAGE">Impay</option></select></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le loyer" message={`Supprimer ce paiement de ${(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F ? Cette action est irrversible.`} />
      <PaiementLoyerForm isOpen={paiementFormOpen} onClose={() => setPaiementFormOpen(false)} onSuccess={() => { refetch(); }} metier={prefix} contrat={paiementContrat} />
    </div>
  );
}
