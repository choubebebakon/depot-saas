import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const CATEGORIES_DEP = ['Alimentation', 'Vétérinaire', 'Achat animal', 'Matériel', 'Personnel', 'Transport', 'Abonnement', 'Autre'];
function ModalDepense({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ libelle: edit?.libelle || '', categorie: edit?.categorie || 'Alimentation', montant: edit?.montant || '', dateDepense: edit?.dateDepense || '', modePaiement: edit?.modePaiement || 'Espèces', notes: edit?.notes || '' });
  const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/elevage/depenses/${edit.id}`, form); else await api.post('/elevage/depenses', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-lime-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? '✏️ Modifier' : '💸 Nouvelle'} Dépense</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Libellé *</label><input required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catégorie</label><select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className={inputClass}>{CATEGORIES_DEP.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F)</label><input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date</label><input type="date" value={form.dateDepense} onChange={e => setForm({...form, dateDepense: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Paiement</label><select value={form.modePaiement} onChange={e => setForm({...form, modePaiement: e.target.value})} className={inputClass}><option>Espèces</option><option>Mobile Money</option><option>Virement</option><option>Carte</option></select></div>
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 bg-lime-500 hover:bg-lime-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">{loading ? '⏳...' : edit ? 'Modifier' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreCat, setFiltreCat] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'depenses'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/elevage/depenses'); setDepenses(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/elevage/depenses/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Dépense supprimée ✓'); load(); } catch (_) { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); } };
  const filtres = depenses.filter(d => { const q = search.toLowerCase(); const matchSearch = !q || d.libelle?.toLowerCase().includes(q) || d.categorie?.toLowerCase().includes(q); const matchC = !filtreCat || d.categorie === filtreCat; return matchSearch && matchC; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-lime-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">💸 Dépenses</h1><p className="text-slate-400 text-sm mt-1">{depenses.length} dépense{depenses.length !== 1 ? 's' : ''} — Total {depenses.reduce((s, d) => s + (d.montant || 0), 0).toLocaleString('fr-FR')} F</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-lime-500 hover:bg-lime-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-lime-500/20">+ Nouvelle Dépense</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Libellé ou catégorie..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-lime-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreCat} onChange={e => { setFiltreCat(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes catégories</option>{CATEGORIES_DEP.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Libellé</th><th className="text-left px-5 py-4">Catégorie</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Paiement</th><th className="text-center px-5 py-4">Date</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune dépense trouvée</td></tr>
              : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{d.libelle}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400">{d.categorie}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{d.modePaiement || '—'}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{d.dateDepense ? new Date(d.dateDepense).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(d); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors" title="Modifier">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(d)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors" title="Supprimer">🗑️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} dépense{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-lime-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ModalDepense onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Dépense modifiée ✓' : 'Dépense créée ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer la dépense" message={`Supprimer « ${confirmDelete?.libelle} » ? Cette action est irréversible.`} />
    </div>
  );
}
