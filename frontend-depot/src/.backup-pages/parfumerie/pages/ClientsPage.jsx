import { useState, useEffect } from 'react'; import api from '../../../api';
import ClientParfumerieForm from '../forms/ClientParfumerieForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function ClientsPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false); const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const limit = 20;
  const load = () => { setLoading(true); api.get('/parfumerie/clients', { params: { page, limit, search } }).then(r => { setData(r.data.data); setTotal(r.data.total); }).catch(() => setData([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [page, search]);
  const handleDelete = async () => { if (!confirm) return; try { await api.delete(`/parfumerie/clients/${confirm.id}`); setConfirm(null); load(); } catch { alert('Erreur'); } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">👤 Clients</h1><p className="text-slate-400 text-sm">{total} client(s)</p></div>
        <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouveau client</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Nom</th><th className="text-left p-4">Téléphone</th><th className="text-left p-4">Email</th><th className="text-right p-4">Points</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{data.map(c => (
            <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.nom}</td><td className="p-4 text-slate-300">{c.telephone}</td><td className="p-4 text-slate-300">{c.email || '-'}</td><td className="p-4 text-right text-fuchsia-400 font-bold">{c.points || 0}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => { setEdit(c); setShowForm(true); }} className="text-fuchsia-400 text-xs">✏️</button><button onClick={() => setConfirm(c)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <ClientParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); setEdit(null); }} onSuccess={load} edit={edit} />
      <ConfirmModal isOpen={!!confirm} onConfirm={handleDelete} onCancel={() => setConfirm(null)} title="Supprimer ?" message={`Supprimer ${confirm?.nom} ?`} />
    </div>
  );
}
