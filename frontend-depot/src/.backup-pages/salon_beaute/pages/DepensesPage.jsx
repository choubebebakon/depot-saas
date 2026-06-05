import { useState, useEffect } from 'react'; import api from '../../../api';
const CATEGORIES = ['LOYER', 'ELECTRICITE', 'EAU', 'PRODUITS', 'ENTRETIEN', 'EQUIPEMENT', 'SALAIRE', 'PUBLICITE', 'AUTRE'];
export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ libelle: '', categorie: 'PRODUITS', montant: '', dateDepense: new Date().toISOString().split('T')[0], notes: '' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/salon/depenses', { params: { page, limit, search } }).then(r => { setDepenses(r.data.data); setTotal(r.data.total); }).catch(() => { setDepenses([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/salon/depenses/${edit.id}`, form); } else { await api.post('/salon/depenses', form); } setShowModal(false); setEdit(null); setForm({ libelle: '', categorie: 'PRODUITS', montant: '', dateDepense: new Date().toISOString().split('T')[0], notes: '' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (d) => { setEdit(d); setForm(d); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/salon/depenses/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">💸 Dépenses</h1><p className="text-slate-400 text-sm">{total} dépense(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ libelle: '', categorie: 'PRODUITS', montant: '', dateDepense: new Date().toISOString().split('T')[0], notes: '' }); setShowModal(true); }} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle dépense</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Libellé</th><th className="text-left p-4">Catégorie</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Date</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{depenses.map(d => (
            <tr key={d.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{d.libelle}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{d.categorie}</span></td><td className="p-4 text-right text-red-400 font-bold">-{Number(d.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-slate-300">{d.dateDepense ? new Date(d.dateDepense).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(d)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvelle'} dépense</h2><form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Catégorie</label><select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      {['libelle','montant','dateDepense'].map(f => (
        <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'montant' ? 'number' : f === 'dateDepense' ? 'date' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'libelle' || f === 'montant'} /></div>
      ))}<div className="flex gap-3 pt-4"><button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1 transition-all">{edit ? 'Enregistrer' : 'Créer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm transition-all">Annuler</button></div></form></div></div>}
    </div>
  );
}
