import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const ESPECES = ['Bovin', 'Ovin', 'Caprin', 'Porcin', 'Volaille', 'Équin'];
function ModalAnimal({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ identifiant: edit?.identifiant || '', espece: edit?.espece || 'Bovin', race: edit?.race || '', sexe: edit?.sexe || 'Mâle', dateNaissance: edit?.dateNaissance || '', poids: edit?.poids || '', enclos: edit?.enclos || '' });
  const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/elevage/troupeaux/${edit.id}`, form); else await api.post('/elevage/troupeaux', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-lime-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">{edit ? '✏️ Modifier' : '🐄 Nouvel'} Animal</h3>
        {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Identifiant *</label><input required value={form.identifiant} onChange={e => setForm({...form, identifiant: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Espèce</label><select value={form.espece} onChange={e => setForm({...form, espece: e.target.value})} className={inputClass}>{ESPECES.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Race</label><input value={form.race} onChange={e => setForm({...form, race: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Sexe</label><select value={form.sexe} onChange={e => setForm({...form, sexe: e.target.value})} className={inputClass}><option>Mâle</option><option>Femelle</option></select></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date naissance</label><input type="date" value={form.dateNaissance} onChange={e => setForm({...form, dateNaissance: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Poids (kg)</label><input type="number" value={form.poids} onChange={e => setForm({...form, poids: e.target.value})} className={inputClass} /></div>
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Enclos / Parc</label><input value={form.enclos} onChange={e => setForm({...form, enclos: e.target.value})} className={inputClass} /></div>
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
export default function TroupeauxPage() {
  const [animaux, setAnimaux] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreEspece, setFiltreEspece] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'troupeaux'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/elevage/troupeaux'); setAnimaux(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/elevage/troupeaux/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Animal supprimé ✓'); load(); } catch (_) { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); } };
  const filtres = animaux.filter(a => { const q = search.toLowerCase(); const matchSearch = !q || a.identifiant?.toLowerCase().includes(q) || a.espece?.toLowerCase().includes(q) || a.race?.toLowerCase().includes(q); const matchEsp = !filtreEspece || a.espece === filtreEspece; return matchSearch && matchEsp; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-lime-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🐄 Troupeaux</h1><p className="text-slate-400 text-sm mt-1">{animaux.length} animal</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-lime-500 hover:bg-lime-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-lime-500/20">+ Nouvel Animal</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Identifiant, espèce..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-lime-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreEspece} onChange={e => { setFiltreEspece(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes espèces</option>{ESPECES.map(e => <option key={e} value={e}>{e}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Animal</th><th className="text-left px-5 py-4">Espèce</th><th className="text-center px-5 py-4">Sexe</th><th className="text-right px-5 py-4">Poids</th><th className="text-center px-5 py-4">Enclos</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun animal trouvé</td></tr>
              : paginated.map(a => (
                <tr key={a.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-lime-500/20 rounded-xl flex items-center justify-center text-lime-400 font-black text-sm">{a.identifiant?.slice(-2)}</div><div><p className="text-white font-semibold text-sm">{a.identifiant}</p>{a.race && <p className="text-slate-500 text-xs">{a.race}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400">{a.espece}</span></td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.sexe === 'Mâle' ? '♂' : '♀'}</td>
                  <td className="px-5 py-4 text-right text-slate-300 text-sm">{a.poids ? `${a.poids} kg` : '—'}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.enclos || '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(a); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors" title="Modifier">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(a)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors" title="Supprimer">🗑️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} animaux — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-lime-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ModalAnimal onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Animal modifié ✓' : 'Animal créé ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer l'animal" message={`Supprimer « ${confirmDelete?.identifiant} » ? Cette action est irréversible.`} />
    </div>
  );
}
