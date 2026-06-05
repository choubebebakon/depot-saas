import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const LIMIT = 20;
export default function StockPage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', categorie: 'PRODUIT', quantite: '', seuilAlerte: '', prixUnitaire: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/stock', { params: { page, limit: LIMIT, search } }); setItems(r.data.data); setTotal(r.data.total); }
    catch { setItems([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setForm({ nom: '', categorie: 'PRODUIT', quantite: '', seuilAlerte: '', prixUnitaire: '' }); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ nom: item.nom || '', categorie: item.categorie || 'PRODUIT', quantite: item.quantite || '', seuilAlerte: item.seuilAlerte || '', prixUnitaire: item.prixUnitaire || '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/pressing/stock/${editItem.id}`, form); else await api.post('/pressing/stock', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/stock/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm';
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📦 Stock / Fournitures</h1><p className="text-slate-400 text-sm">{total} article(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvel article</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Nom</th><th className="text-left p-4">Catégorie</th><th className="text-right p-4">Qté</th><th className="text-right p-4">Seuil</th><th className="text-right p-4">Prix unit.</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{items.map(item => (
            <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{item.nom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{item.categorie}</span></td><td className="p-4 text-right text-white font-bold">{item.quantite || 0}</td><td className="p-4 text-right text-slate-300">{item.seuilAlerte || '-'}</td><td className="p-4 text-right text-white font-bold">{Number(item.prixUnitaire || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(item)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(item)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier article' : '📦 Nouvel article'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Catégorie</label><select value={form.categorie} onChange={set('categorie')} className={inputClass}><option value="PRODUIT">Produit nettoyage</option><option value="EMBALLAGE">Emballage</option><option value="ACCESSOIRE">Accessoire</option><option value="AUTRE">Autre</option></select></div>
        {['nom','quantite','seuilAlerte','prixUnitaire'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'nom' ? 'Nom' : f === 'quantite' ? 'Quantité' : f === 'seuilAlerte' ? 'Seuil alerte' : 'Prix unitaire (F)'}</label><input type={f === 'nom' ? 'text' : 'number'} value={form[f]} onChange={set(f)} className={inputClass} required={f === 'nom' || f === 'quantite'} /></div>
        ))}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer l'article" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
