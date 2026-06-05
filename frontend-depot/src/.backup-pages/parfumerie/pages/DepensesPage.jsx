import { useState, useEffect } from 'react'; import api from '../../../api';
import DepenseParfumerieForm from '../forms/DepenseParfumerieForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function DepensesPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false); const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const limit = 20;
  const load = () => { setLoading(true); api.get('/parfumerie/depenses', { params: { page, limit, search } }).then(r => { setData(r.data.data); setTotal(r.data.total); }).catch(() => setData([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [page, search]);
  const handleDelete = async () => { if (!confirm) return; try { await api.delete(`/parfumerie/depenses/${confirm.id}`); setConfirm(null); load(); } catch { alert('Erreur'); } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">💸 Dépenses</h1><p className="text-slate-400 text-sm">{total} dépense(s)</p></div><button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Libellé</th><th className="text-left p-4">Catégorie</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Date</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{data.map(d => (
          <tr key={d.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{d.libelle}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{d.categorie}</span></td><td className="p-4 text-right text-red-400 font-bold">-{Number(d.montant).toLocaleString('fr-FR')} F</td><td className="p-4 text-slate-300">{d.dateDepense ? new Date(d.dateDepense).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => { setEdit(d); setShowForm(true); }} className="text-fuchsia-400 text-xs">✏️</button><button onClick={() => setConfirm(d)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <DepenseParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); setEdit(null); }} onSuccess={load} edit={edit} />
      <ConfirmModal isOpen={!!confirm} onConfirm={handleDelete} onCancel={() => setConfirm(null)} title="Supprimer ?" message={`Supprimer ${confirm?.libelle} ?`} />
    </div>
  );
}
