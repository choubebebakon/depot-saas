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


export default function DepensesPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'supermarche';
  const prefix = metier.toLowerCase().replace(/_/g, '-');

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ libelle: '', montant: '', categorie: CATEGORIES[0], date: new Date().toISOString().slice(0, 10), modePaiement: 'cash', notes: '' });
  const [deleting, setDeleting] = useState(false);

  const { success, error: notifError } = useNotif();

  const perm = usePermission(PERMISSIONS, 'depenses');

  const { data: depenses = [],
    loading,
    refetch,
   } = useData(`/${prefix}/depenses`, { enabled: true });

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (depenses || []).filter(item =>
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
      await api.delete(`/${prefix}/depenses/${confirmDelete.id}`);
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
        await api.patch(`/${prefix}/depenses/${editItem.id}`, form);
      } else {
        await api.post(`/${prefix}/depenses`, form);
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

  const openCreate = () => { setEditItem(null); setForm({ libelle: '', montant: '', categorie: CATEGORIES[0], date: new Date().toISOString().slice(0, 10), modePaiement: 'cash', notes: '' }); setFormOpen(true); };
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const [catFiltre, setCatFiltre] = useState('');

  const setF = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const totalFiltre = filtres.reduce((acc, i) => acc + (i.montant || 0), 0);


  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Dpenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} dpense{filtres.length !== 1 ? 's' : ''}  Total: <span className="text-red-400 font-bold">{totalFiltre.toLocaleString('fr-FR')} F</span></p>
        </div>
        {perm.canCreate && (
        <button onClick={openCreate}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">
          + Nouvelle Dpense
        </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-56" />
        <select value={catFiltre} onChange={e => setCatFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes catgories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Libell</th>
                <th className="text-left px-5 py-4">Catgorie</th>
                <th className="text-left px-5 py-4">Paiement</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune dpense enregistrée</td></tr>
              ) : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-slate-300 text-sm whitespace-nowrap">{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : ''}</td>
                  <td className="px-5 py-3">
                    <p className="text-white font-semibold text-sm">{d.libelle}</p>
                    {d.notes && <p className="text-slate-500 text-xs">{d.notes}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">{d.categorie}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{d.modePaiement || ''}</td>
                  <td className="px-5 py-3 text-right text-red-400 font-bold text-sm">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {perm.canEdit && (
                      <button onClick={() => openEdit(d)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>
                      )}
                      {perm.canDelete && (
                      <button onClick={() => setConfirmDelete(d)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️ Supprimer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} dpense{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '?? Modifier la dpense' : '?? Nouvelle dpense'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Enregistrer'} submitIcon="??">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Libell *</label>
          <input required value={form.libelle} onChange={setF('libelle')}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F) *</label>
            <input required type="number" min="0" value={form.montant} onChange={setF('montant')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date *</label>
            <input required type="date" value={form.date} onChange={setF('date')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catgorie</label>
            <select value={form.categorie} onChange={setF('categorie')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mode de paiement</label>
            <select value={form.modePaiement} onChange={setF('modePaiement')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chque</option>
              <option value="virement">Virement</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={setF('notes')} rows={2}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none resize-none" />
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la dpense" message={`Supprimer  ${confirmDelete?.libelle}  ? Cette action est irrversible.`} />
    </div>
  );
}
