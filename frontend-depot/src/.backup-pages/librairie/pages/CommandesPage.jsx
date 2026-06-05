import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

function ModalCommande({ onClose, onSuccess, edit }) {
  const [form, setForm] = useState({ articleId: edit?.articleId || '', fournisseurId: edit?.fournisseurId || '', quantite: edit?.quantite || '', montant: edit?.montant || '', statut: edit?.statut || 'EN_ATTENTE', dateLivraison: edit?.dateLivraison?.split('T')[0] || '' });
  const [articles, setArticles] = useState([]); const [fournisseurs, setFournisseurs] = useState([]); const [loading, setLoading] = useState(false); const [erreur, setErreur] = useState('');
  useEffect(() => { api.get('/librairie/catalogue').then(r => setArticles(r.data?.data || r.data || [])); api.get('/librairie/fournisseurs').then(r => setFournisseurs(r.data?.data || r.data || [])); }, []);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { if (edit) await api.patch(`/librairie/commandes/${edit.id}`, form); else await api.post('/librairie/commandes', form); onSuccess(); onClose(); } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); } finally { setLoading(false); } };
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl">
      <h3 className="text-white font-black text-xl mb-6">{edit ? '✏️ Modifier' : '📦 Nouvelle'} Commande</h3>
      {erreur && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{erreur}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Article *</label><select required value={form.articleId} onChange={e => setForm({...form, articleId: e.target.value})} className={inputClass}><option value="">Sélectionner</option>{articles.map(a => <option key={a.id} value={a.id}>{a.titre}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fournisseur *</label><select required value={form.fournisseurId} onChange={e => setForm({...form, fournisseurId: e.target.value})} className={inputClass}><option value="">Sélectionner</option>{fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Quantité</label><input type="number" value={form.quantite} onChange={e => setForm({...form, quantite: e.target.value})} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F CFA)</label><input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})} className={inputClass}><option value="EN_ATTENTE">En attente</option><option value="CONFIRMEE">Confirmée</option><option value="RECUE">Reçue</option><option value="ANNULEE">Annulée</option></select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date livraison</label><input type="date" value={form.dateLivraison} onChange={e => setForm({...form, dateLivraison: e.target.value})} className={inputClass} /></div>
        </div>
        <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl">Annuler</button><button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl">{loading ? '⏳...' : edit ? 'Modifier' : 'Créer'}</button></div>
      </form>
    </div></div>
  );
}

export default function CommandesPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false); const [notif, setNotif] = useState(null);
  const perm = usePermission(PERMISSIONS, 'commandes'); const itemsPerPage = 20;
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/librairie/commandes'); const items = res.data?.data || res.data || []; setData(items); setTotal(items.length); } catch (_) { setData([]); setTotal(0); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/librairie/commandes/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Supprimée ✓'); load(); } catch { showNotif('Erreur', 'error'); } finally { setDeleting(false); } };
  const filtres = data.filter(i => { const q = search.toLowerCase(); return !q || i.article?.titre?.toLowerCase().includes(q) || i.fournisseur?.nom?.toLowerCase().includes(q) || i.statut?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📦 Commandes</h1><p className="text-slate-400 text-sm mt-1">{data.length} commande{data.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/20">+ Nouvelle Commande</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Article, fournisseur..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full"><thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Article</th><th className="text-left px-5 py-4">Fournisseur</th><th className="text-right px-5 py-4">Qté</th><th className="text-right px-5 py-4">Montant</th><th className="text-left px-5 py-4">Livraison</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucune commande</td></tr>
              : paginated.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{i.article?.titre || '—'}</td>
                  <td className="px-5 py-4 text-slate-300">{i.fournisseur?.nom || '—'}</td>
                  <td className="px-5 py-4 text-right text-white">{i.quantite || 0}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(i.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{i.dateLivraison ? new Date(i.dateLivraison).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${i.statut === 'RECUE' ? 'bg-green-500/20 text-green-400' : i.statut === 'CONFIRMEE' ? 'bg-blue-500/20 text-blue-400' : i.statut === 'ANNULEE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{i.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(i)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} commande{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1"><button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">◀</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}<button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">▶</button></div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ModalCommande onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Commande modifiée ✓' : 'Commande créée ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} message="Supprimer cette commande ?" loading={deleting} />
    </div>
  );
}
