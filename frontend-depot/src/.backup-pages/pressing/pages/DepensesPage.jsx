import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const CATEGORIES = ['LOYER', 'ELECTRICITE', 'EAU', 'PRODUITS', 'ENTRETIEN', 'EQUIPEMENT', 'SALAIRE', 'TRANSPORT', 'AUTRE'];
const LIMIT = 20;
export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ libelle: '', categorie: 'PRODUITS', montant: '', dateDepense: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/depenses', { params: { page, limit: LIMIT, search } }); setDepenses(r.data.data); setTotal(r.data.total); }
    catch { setDepenses([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setForm({ libelle: '', categorie: 'PRODUITS', montant: '', dateDepense: new Date().toISOString().split('T')[0], notes: '' }); setFormOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ libelle: d.libelle || '', categorie: d.categorie || 'PRODUITS', montant: d.montant || '', dateDepense: d.dateDepense ? d.dateDepense.split('T')[0] : new Date().toISOString().split('T')[0], notes: d.notes || '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/pressing/depenses/${editItem.id}`, form); else await api.post('/pressing/depenses', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/depenses/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm';
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">💸 Dépenses</h1><p className="text-slate-400 text-sm">{total} dépense(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle dépense</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Libellé</th><th className="text-left p-4">Catégorie</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Date</th><th className="text-left p-4">Notes</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{depenses.map(d => (
            <tr key={d.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{d.libelle}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{d.categorie}</span></td><td className="p-4 text-right text-red-400 font-bold">-{Number(d.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-slate-300">{d.dateDepense ? new Date(d.dateDepense).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-slate-300">{d.notes || '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(d)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(d)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier dépense' : '💸 Nouvelle dépense'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Catégorie</label><select value={form.categorie} onChange={set('categorie')} className={inputClass}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        {['libelle','montant','dateDepense','notes'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'libelle' ? 'Libellé' : f === 'montant' ? 'Montant (F)' : f === 'dateDepense' ? 'Date' : 'Notes'}</label><input type={f === 'montant' ? 'number' : f === 'dateDepense' ? 'date' : 'text'} value={form[f]} onChange={set(f)} className={inputClass} required={f === 'libelle' || f === 'montant'} /></div>
        ))}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la dépense" message={`Supprimer la dépense « ${confirmDelete?.libelle} » (${Number(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F) ?`} />
    </div>
  );
}
