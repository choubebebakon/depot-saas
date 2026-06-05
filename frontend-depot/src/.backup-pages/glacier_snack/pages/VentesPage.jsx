import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function VentesPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const limit = 20;
  const load = useCallback(() => {
    setLoading(true);
    api.get('/glacier_snack/ventes', { params: { page, limit, search } }).then(r => { setData(r.data.data); setTotal(r.data.total); }).catch(() => { setData([]); }).finally(() => setLoading(false));
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/glacier_snack/ventes/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const totalPages = Math.ceil(total / limit);

  const [form, setForm] = useState({ article: '', quantite: '1', montant: '', modePaiement: 'ESPECES' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  useEffect(() => {
    if (formOpen && editItem) setForm({ article: editItem.article || '', quantite: editItem.quantite || '1', montant: editItem.montant || '', modePaiement: editItem.modePaiement || 'ESPECES' });
    else if (formOpen) setForm({ article: '', quantite: '1', montant: '', modePaiement: 'ESPECES' });
  }, [editItem, formOpen]);
  const handleFormSubmit = async (e) => {
    e.preventDefault(); const errs = {}; if (!form.article) errs.article = "L'article est requis"; if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant doit être > 0'; setFormErrors(errs);
    if (Object.keys(errs).length > 0) return; setFormLoading(true);
    try { if (editItem) await api.patch(`/glacier_snack/ventes/${editItem.id}`, form); else await api.post('/glacier_snack/ventes', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setFormLoading(false); }
  };
  const setFormField = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">💰 Ventes</h1><p className="text-slate-400 text-sm">{total} vente(s)</p></div>
        <button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle vente</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Article</th><th className="p-4 text-right">Qté</th><th className="p-4 text-right">Montant</th><th className="p-4 text-left">Paiement</th><th className="p-4 text-left">Date</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{data.map(item => (
          <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{item.article}</td><td className="p-4 text-right text-white">{item.quantite}</td><td className="p-4 text-right text-white font-bold">{Number(item.montant).toLocaleString()} F</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{item.modePaiement}</span></td><td className="p-4 text-slate-300">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(item)} className="text-cyan-400 text-xs">✏️</button><button onClick={() => setConfirmDelete(item)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setFormOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-black text-xl">{editItem ? '✏️ Modifier' : '➕ Nouvelle'} vente</h3>
              <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-lg">✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                {['article','quantite','montant'].map(f => (<div key={f}><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">{f} {(f === 'article' || f === 'montant') ? '* ' : ''}</label><input type={f === 'quantite' || f === 'montant' ? 'number' : 'text'} value={form[f]} onChange={setFormField(f)} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all" required={f === 'montant'} /></div>))}
                <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Mode de paiement</label><select value={form.modePaiement} onChange={setFormField('modePaiement')} className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"><option value="ESPECES">Espèces</option><option value="CARTE">Carte</option><option value="MOBILE">Mobile money</option></select></div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={formLoading} className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  {formLoading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enregistrement...</> : <>{editItem ? 'Modifier' : 'Créer'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} message={`Supprimer la vente de ${confirmDelete?.article || 'cet élément'} ?`} loading={deleting} />
    </div>
  );
}
