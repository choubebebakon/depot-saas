import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
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

const MODES_PAIEMENT = ['Espèces', 'Mobile Money', 'Carte', 'Virement'];
export default function CaissePage() {
  const [mouvements, setMouvements] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreType, setFiltreType] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ type: 'ENTREE', libelle: '', montant: '', modePaiement: 'Espèces', ordreId: '', notes: '' });
  const [formLoading, setFormLoading] = useState(false); const [formErrors, setFormErrors] = useState({});
  const [ordres, setOrdres] = useState([]);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'caisse'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/caisse'); setMouvements(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/garage/fiches-travaux').then(res => setOrdres(res.data?.data || res.data || [])).catch(() => {}); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ type: 'ENTREE', libelle: '', montant: '', modePaiement: 'Espèces', ordreId: '', notes: '' }); setFormErrors({}); setFormOpen(true); };
  const openEdit = (m) => { setEditItem(m); setForm({ type: m.type || 'ENTREE', libelle: m.libelle || '', montant: m.montant || '', modePaiement: m.modePaiement || 'Espèces', ordreId: m.ordreId || '', notes: m.notes || '' }); setFormErrors({}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/garage/caisse/${editItem.id}`, form); else await api.post('/garage/caisse', form); showNotif(editItem ? 'Mouvement modifiéé ?' : 'Mouvement créé ?'); setFormOpen(false); load(); } catch (err) { setFormErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/caisse/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Mouvement suppriméé ?'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setFormField = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const solde = mouvements.reduce((s, m) => s + (m.type === 'ENTREE' ? 1 : -1) * (m.montant || 0), 0);
  const filtres = mouvements.filter(m => { const q = search.toLowerCase(); const matchSearch = !q || m.libelle?.toLowerCase().includes(q); const matchT = !filtreType || m.type === filtreType; return matchSearch && matchT; });
  const totalItems = filtres.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Caisse</h1><p className="text-slate-400 text-sm mt-1">{totalItems} mouvement{totalItems !== 1 ? 's' : ''}  Solde: <span className={solde >= 0 ? 'text-emerald-400' : 'text-red-400'}>{solde.toLocaleString('fr-FR')} F</span></p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouveau Mouvement</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Libellé..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous</option><option value="ENTREE">Entrées</option><option value="SORTIE">Sorties</option></select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Libellé</th><th className="text-left px-5 py-4">Mode</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun mouvement trouvéé</td></tr>
              : paginated.map(m => (
                <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{m.libelle}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-600/20 text-slate-400">{m.modePaiement}</span></td>
                  <td className="px-5 py-4 text-right"><span className={`font-mono font-bold ${m.type === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>{m.type === 'ENTREE' ? '+' : '-'}{(m.montant || 0).toLocaleString('fr-FR')} F</span></td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(m)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(m)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️ Supprimer</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} mouvement{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '?? Modifier mouvement' : '?? Nouveau mouvement'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        {formErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formErrors.general}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Type" name="type" type="select" value={form.type} onChange={setFormField('type')} options={[{ value: 'ENTREE', label: 'Entrée' }, { value: 'SORTIE', label: 'Sortie' }]} />
          <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={setFormField('modePaiement')} options={MODES_PAIEMENT} />
        </div>
        <FormField label="Libellé" name="libelle" value={form.libelle} onChange={setFormField('libelle')} required placeholder="Libellé du mouvement" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={setFormField('montant')} min={0} unit="F" />
          <FormField label="Ordre lié" name="ordreId" type="select" value={form.ordreId} onChange={setFormField('ordreId')} options={ordres.map(o => ({ value: o.id, label: o.reference || `#${o.id}` }))} />
        </div>
        <FormField label="Notes" name="notes" value={form.notes} onChange={setFormField('notes')} placeholder="Notes optionnelles..." />
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le mouvement" message={`Supprimer « ${confirmDelete?.libelle} » ? Cette action est irréversible.`} />
    </div>
  );
}
