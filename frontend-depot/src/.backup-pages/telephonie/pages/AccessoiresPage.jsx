import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const TYPES_ACCESSOIRE = ['Écouteurs', 'Chargeur', 'Câble', 'Coque', 'Film protecteur', 'Batterie', 'Carte mémoire', 'Autre'];
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function AccessoiresPage() {
  const [accessoires, setAccessoires] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreType, setFiltreType] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ type: 'Écouteurs', designation: '', prixAchat: '', prixVente: '', stock: 1, fournisseurId: '' });
  const [fournisseurs, setFournisseurs] = useState([]); const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'accessoires'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/accessoires'); setAccessoires(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ type: 'Écouteurs', designation: '', prixAchat: '', prixVente: '', stock: 1, fournisseurId: '' }); api.get('/telephonie/fournisseurs').then(r => setFournisseurs(r.data?.data || r.data || [])).catch(() => {}); setFormOpen(true); };
  const openEdit = (a) => { setEditItem(a); setForm({ type: a.type || 'Écouteurs', designation: a.designation || '', prixAchat: a.prixAchat || '', prixVente: a.prixVente || '', stock: a.stock || 1, fournisseurId: a.fournisseurId || '' }); api.get('/telephonie/fournisseurs').then(r => setFournisseurs(r.data?.data || r.data || [])).catch(() => {}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/telephonie/accessoires/${editItem.id}`, form); else await api.post('/telephonie/accessoires', form); setFormOpen(false); showNotif(editItem ? 'Accessoire modifié ✓' : 'Accessoire créé ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/accessoires/${confirmDelete.id}`); showNotif('Accessoire supprimé ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = accessoires.filter(a => { const q = search.toLowerCase(); const matchSearch = !q || a.designation?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q); const matchT = !filtreType || a.type === filtreType; return matchSearch && matchT; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🎧 Accessoires</h1><p className="text-slate-400 text-sm mt-1">{accessoires.length} accessoire{accessoires.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouvel Accessoire</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Désignation ou type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous types</option>{TYPES_ACCESSOIRE.map(t => <option key={t} value={t}>{t}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Désignation</th><th className="text-left px-5 py-4">Type</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Stock</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun accessoire trouvé</td></tr>
              : paginated.map(a => (
                <tr key={a.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{a.designation}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{a.type}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(a.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{a.stock || 0}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(a)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(a)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} accessoire{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier accessoire' : '🎧 Nouvel accessoire'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label><select value={form.type} onChange={setF('type')} className={inputClass}>{TYPES_ACCESSOIRE.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Désignation *</label><input required value={form.designation} onChange={setF('designation')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix achat (F)</label><input type="number" value={form.prixAchat} onChange={setF('prixAchat')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix vente (F)</label><input type="number" value={form.prixVente} onChange={setF('prixVente')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Stock</label><input type="number" value={form.stock} onChange={setF('stock')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur</label><select value={form.fournisseurId} onChange={setF('fournisseurId')} className={inputClass}><option value="">Aucun</option>{fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer l'accessoire" message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.designation}" ?`} />
    </div>
  );
}
