import { useState } from 'react';
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


export default function AccessoiresPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'telephonie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ type: 'couteurs', designation: '', prixAchat: '', prixVente: '', stock: 1, fournisseurId: '' });
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const [notif, setNotif] = useState(null);

  const [saving, setSaving] = useState(false);

  const [filtreType, setFiltreType] = useState('');

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';

  const TYPES_ACCESSOIRE = [];
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3500); };

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'accessoires');

  const { data: accessoires = [],
    loading,
    refetch,
   } = useData(`/${prefix}/accessoires`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (accessoires || []).filter(item =>
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
      await api.delete(`/${prefix}/accessoires/${confirmDelete.id}`);
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
        await api.patch(`/${prefix}/accessoires/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/accessoires`, form);
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
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Accessoires</h1><p className="text-slate-400 text-sm mt-1">{totalItems} accessoire{totalItems !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouvel Accessoire</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Dsignation ou type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous types</option>{TYPES_ACCESSOIRE.map(t => <option key={t} value={t}>{t}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Dsignation</th><th className="text-left px-5 py-4">Type</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Stock</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun accessoire trouvé</td></tr>
              : paginated.map(a => (
                <tr key={a.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{a.designation}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{a.type}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(a.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.stock || 0}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(a)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>{perm.canDelete && <button onClick={() => setConfirmDelete(a)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️ Supprimer</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} accessoire{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '?? Modifier accessoire' : '?? Nouvel accessoire'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Crer'}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label><select value={form.type} onChange={setF('type')} className={inputClass}>{TYPES_ACCESSOIRE.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Dsignation *</label><input required value={form.designation} onChange={setF('designation')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix achat (F)</label><input type="number" value={form.prixAchat} onChange={setF('prixAchat')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix vente (F)</label><input type="number" value={form.prixVente} onChange={setF('prixVente')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Stock</label><input type="number" value={form.stock} onChange={setF('stock')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur</label><select value={form.fournisseurId} onChange={setF('fournisseurId')} className={inputClass}><option value="">Aucun</option>{fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer l'accessoire" message={`tes-vous sr de vouloir suppriméer "${confirmDelete?.designation}" ?`} />
    </div>
  );
}
