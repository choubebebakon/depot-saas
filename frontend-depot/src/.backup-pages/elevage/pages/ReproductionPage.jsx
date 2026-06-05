import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
function ModalRepro({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ animalId: edit?.animalId || '', partenaireId: edit?.partenaireId || '', dateSaillie: edit?.dateSaillie || '', datePrevueNaissance: edit?.datePrevueNaissance || '', statut: edit?.statut || 'En attente', notes: edit?.notes || '' });
  const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/elevage/reproduction/${edit.id}`, form); else await api.post('/elevage/reproduction', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-lime-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? '✏️ Modifier' : '🧬 Nouvel'} Accouplement</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Animal (♀)</label><input value={form.animalId} onChange={e => setForm({...form, animalId: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Partenaire (♂)</label><input value={form.partenaireId} onChange={e => setForm({...form, partenaireId: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date saillie</label><input type="date" value={form.dateSaillie} onChange={e => setForm({...form, dateSaillie: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Naissance prévue</label><input type="date" value={form.datePrevueNaissance} onChange={e => setForm({...form, datePrevueNaissance: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})} className={inputClass}><option>En attente</option><option>Confirmé</option><option>Naissance</option><option>Échec</option></select></div>
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
export default function ReproductionPage() {
  const [accouplements, setAccouplements] = useState([]); const [loading, setLoading] = useState(true); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [notif, setNotif] = useState(null); const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'reproduction'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/elevage/reproduction'); setAccouplements(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/elevage/reproduction/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Accouplement supprimé ✓'); load(); } catch (_) { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); } };
  const totalPages = Math.ceil(accouplements.length / itemsPerPage); const paginated = accouplements.slice((page - 1) * itemsPerPage, page * itemsPerPage); const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-lime-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🧬 Reproduction</h1><p className="text-slate-400 text-sm mt-1">{accouplements.length} accouplement{accouplements.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-lime-500 hover:bg-lime-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-lime-500/20">+ Nouvel Accouplement</button>}
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Animal (♀)</th><th className="text-left px-5 py-4">Partenaire (♂)</th><th className="text-center px-5 py-4">Saillie</th><th className="text-center px-5 py-4">Naissance prévue</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun accouplement</td></tr>
              : paginated.map(a => (
                <tr key={a.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{a.animalId || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{a.partenaireId || '—'}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.dateSaillie ? new Date(a.dateSaillie).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.datePrevueNaissance ? new Date(a.datePrevueNaissance).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.statut === 'Naissance' ? 'bg-emerald-500/20 text-emerald-400' : a.statut === 'Confirmé' ? 'bg-blue-500/20 text-blue-400' : a.statut === 'Échec' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{a.statut}</span></td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(a); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors" title="Modifier">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(a)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors" title="Supprimer">🗑️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (<div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30"><span className="text-slate-400 text-xs">{accouplements.length} accouplement{accouplements.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span><div className="flex gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-lime-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
            <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
          </div></div>)}
        </div>
      )}
      {formOpen && <ModalRepro onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Accouplement modifié ✓' : 'Accouplement créé ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer l'accouplement" message={`Supprimer cet accouplement ? Cette action est irréversible.`} />
    </div>
  );
}
