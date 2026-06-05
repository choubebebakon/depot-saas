import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function StockPage() {
  const [mouvements, setMouvements] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreType, setFiltreType] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ type: 'ENTREE', categorie: 'Téléphone', articleId: '', quantite: 1, date: '', notes: '' });
  const [telephones, setTelephones] = useState([]); const [accessoires, setAccessoires] = useState([]); const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'stock'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/stock'); setMouvements(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ type: 'ENTREE', categorie: 'Téléphone', articleId: '', quantite: 1, date: '', notes: '' }); setFormOpen(true); };
  const openEdit = (m) => { setEditItem(m); setForm({ type: m.type || 'ENTREE', categorie: m.categorie || 'Téléphone', articleId: m.articleId || '', quantite: m.quantite || 1, date: m.date || '', notes: m.notes || '' }); api.get('/telephonie/telephones').then(r => setTelephones(r.data?.data || r.data || [])).catch(() => {}); api.get('/telephonie/accessoires').then(r => setAccessoires(r.data?.data || r.data || [])).catch(() => {}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/telephonie/stock/${editItem.id}`, form); else await api.post('/telephonie/stock', form); setFormOpen(false); showNotif(editItem ? 'Mouvement modifié ✓' : 'Mouvement créé ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/stock/${confirmDelete.id}`); showNotif('Mouvement supprimé ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  useEffect(() => { if (formOpen && !editItem) { api.get('/telephonie/telephones').then(r => setTelephones(r.data?.data || r.data || [])).catch(() => {}); api.get('/telephonie/accessoires').then(r => setAccessoires(r.data?.data || r.data || [])).catch(() => {}); } }, [formOpen, editItem]);
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = mouvements.filter(m => { const q = search.toLowerCase(); const matchSearch = !q || m.article?.designation?.toLowerCase().includes(q); const matchT = !filtreType || m.type === filtreType; return matchSearch && matchT; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📦 Stock</h1><p className="text-slate-400 text-sm mt-1">{mouvements.length} mouvement{mouvements.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouveau Mouvement</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Article..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous</option><option value="ENTREE">Entrées</option><option value="SORTIE">Sorties</option></select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Article</th><th className="text-center px-5 py-4">Type</th><th className="text-right px-5 py-4">Qté</th><th className="text-center px-5 py-4">Date</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun mouvement trouvé</td></tr>
              : paginated.map(m => (
                <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{m.article?.designation || m.article?.modele || '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.type === 'ENTREE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{m.type}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{m.quantite || 0}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{m.date ? new Date(m.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(m)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(m)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} mouvement{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier mouvement' : '📦 Nouveau mouvement'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label><select value={form.type} onChange={setF('type')} className={inputClass}><option value="ENTREE">Entrée</option><option value="SORTIE">Sortie</option></select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catégorie</label><select value={form.categorie} onChange={setF('categorie')} className={inputClass}><option>Téléphone</option><option>Accessoire</option></select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Article *</label><select required value={form.articleId} onChange={setF('articleId')} className={inputClass}><option value="">Sélectionner...</option>{form.categorie === 'Téléphone' ? telephones.map(t => <option key={t.id} value={t.id}>{t.marque} {t.modele}</option>) : accessoires.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Quantité</label><input type="number" value={form.quantite} onChange={setF('quantite')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date</label><input type="date" value={form.date} onChange={setF('date')} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><input value={form.notes} onChange={setF('notes')} className={inputClass} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer le mouvement" message={`Êtes-vous sûr de vouloir supprimer ce mouvement ?`} />
    </div>
  );
}
