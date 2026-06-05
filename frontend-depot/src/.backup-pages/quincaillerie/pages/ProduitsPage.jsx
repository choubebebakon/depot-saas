import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const UNITES = ['pièce', 'mètre', 'kg', 'sac', 'boîte', 'rouleau', 'carton'];
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function ProduitsPage() {
  const [produits, setProduits] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ designation: '', categorieId: '', unite: 'pièce', prixAchat: '', prixVente: '', stockMin: '', reference: '' });
  const [categories, setCategories] = useState([]); const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'produits'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/quincaillerie/produits'); setProduits(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/quincaillerie/categories').then(res => setCategories(res.data?.data || res.data || [])).catch(() => {}); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ designation: '', categorieId: '', unite: 'pièce', prixAchat: '', prixVente: '', stockMin: '', reference: '' }); setFormOpen(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ designation: p.designation || '', categorieId: p.categorieId || '', unite: p.unite || 'pièce', prixAchat: p.prixAchat || '', prixVente: p.prixVente || '', stockMin: p.stockMin || '', reference: p.reference || '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/quincaillerie/produits/${editItem.id}`, form); else await api.post('/quincaillerie/produits', form); setFormOpen(false); showNotif(editItem ? 'Produit modifié ✓' : 'Produit créé ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/quincaillerie/produits/${confirmDelete.id}`); showNotif('Produit supprimé ✓'); setConfirmDelete(null); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = produits.filter(p => { const q = search.toLowerCase(); return !q || p.designation?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-amber-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🛠 Produits</h1><p className="text-slate-400 text-sm mt-1">{produits.length} produit{produits.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20">+ Nouveau Produit</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Désignation ou référence..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Produit</th><th className="text-right px-5 py-4">Prix achat</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Stock min</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr>
              : paginated.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-amber-600/20 rounded-xl flex items-center justify-center text-amber-400 font-black text-sm">{p.designation?.slice(0, 2).toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{p.designation}</p>{p.reference && <p className="text-slate-500 text-xs">{p.reference}</p>}</div></div></td>
                  <td className="px-5 py-4 text-right text-slate-300 text-sm">{(p.prixAchat || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(p.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{p.stockMin || '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(p)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(p)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} produit{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier Produit' : '🛠 Nouveau Produit'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Désignation *</label><input required value={form.designation} onChange={setF('designation')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catégorie</label><select value={form.categorieId} onChange={setF('categorieId')} className={inputClass}><option value="">Aucune</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Référence</label><input value={form.reference} onChange={setF('reference')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Unité</label><select value={form.unite} onChange={setF('unite')} className={inputClass}>{UNITES.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Stock min</label><input type="number" value={form.stockMin} onChange={setF('stockMin')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix achat (F)</label><input type="number" value={form.prixAchat} onChange={setF('prixAchat')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix vente (F)</label><input type="number" value={form.prixVente} onChange={setF('prixVente')} className={inputClass} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le produit" message={`Supprimer « ${confirmDelete?.designation} » ? Cette action est irréversible.`} />
    </div>
  );
}
