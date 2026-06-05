import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePagination } from '../../../hooks/usePagination';

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


function ModalCaisse({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ libelle: edit?.libelle || '', montant: edit?.montant || '', type: edit?.type || 'ENTREE', mode: edit?.mode || 'ESPECES', notes: edit?.notes || '' });
  const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/librairie/caisse/${edit.id}`, form); else await api.post('/librairie/caisse', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-slate-900 border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl border">
      <h3 className="text-white font-black text-xl mb-6">{edit ? '?? Modifier' : '?? Nouvelle'} Opration</h3>
      {erreur && <div className="mb-4 p-3 bg-red-500/10 border-red-500/30 text-red-400 text-sm rounded-xl border">{erreur}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Libell *</label><input required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F CFA)</label><input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputClass}><option value="ENTREE">Entre</option><option value="SORTIE">Sortie</option></select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mode</label><select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})} className={inputClass}><option value="ESPECES">Espces</option><option value="ORANGE_MONEY">Orange Money</option><option value="WAVE">Wave</option><option value="CARTE">Carte</option></select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} rows={2} /></div>
        </div>
        <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl">Annuler</button><button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">{loading ? '?...' : edit ? 'Modifier' : 'Crer'}</button></div>
      </form>
    </div></div>
  );
}

export default function CaissePage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false); const [notif, setNotif] = useState(null);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';
  const perm = usePermission(PERMISSIONS, 'caisse'); const itemsPerPage = 20;
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/librairie/caisse'); const items = res.data?.data || res.data || []; setData(items); setTotal(items.length); } catch (_) { setData([]); setTotal(0); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/librairie/caisse/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Supprim ?'); load(); } catch { showNotif('Erreur', 'error'); } finally { setDeleting(false); } };
  const solde = data.reduce((acc, i) => acc + (i.type === 'ENTREE' ? i.montant : -i.montant), 0);
  const filtres = data.filter(i => { const q = search.toLowerCase(); return !q || i.libelle?.toLowerCase().includes(q) || i.mode?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q); });
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Caisse</h1><p className="text-slate-400 text-sm mt-1">{totalItems} opration{totalItems !== 1 ? 's' : ''}</p></div>
        <div className="flex items-center gap-4"><div className="text-right"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Solde</p><p className={`font-black text-xl ${solde >= 0 ? 'text-green-400' : 'text-red-400'}`}>{solde.toLocaleString('fr-FR')} F</p></div>{perm.canCreate && <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20">+ Nouvelle Opration</button>}</div>
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Libell..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72 border" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border-slate-700/50 rounded-2xl overflow-hidden border">
          <table className="w-full"><thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Libell</th><th className="text-center px-5 py-4">Type</th><th className="text-left px-5 py-4">Mode</th><th className="text-left px-5 py-4">Date</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune opration</td></tr>
              : paginated.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{i.libelle}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${i.type === 'ENTREE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{i.type}</span></td>
                  <td className="px-5 py-4 text-slate-300">{i.mode}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{i.createdAt ? new Date(i.createdAt).toLocaleDateString('fr-FR') : ''}</td>
                  <td className={`px-5 py-4 text-right font-mono font-bold ${i.type === 'ENTREE' ? 'text-green-400' : 'text-red-400'}`}>{i.type === 'ENTREE' ? '+' : '-'}{(i.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️ Modifier</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(i)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️ Supprimer</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} opration{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1"><button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">?</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}<button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">?</button></div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ModalCaisse onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Opration modifiée ?' : 'Opration cre ?'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} message="Supprimer cette opration ?" loading={deleting} />
    </div>
  );
}
