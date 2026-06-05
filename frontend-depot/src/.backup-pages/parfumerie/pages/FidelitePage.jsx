import { useState, useEffect } from 'react'; import api from '../../../api';
import FideliteParfumerieForm from '../forms/FideliteParfumerieForm';
export default function FidelitePage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false);
  const limit = 20;
  const load = () => { setLoading(true); api.get('/parfumerie/fidelite', { params: { page, limit, search } }).then(r => { setData(r.data.data); setTotal(r.data.total); }).catch(() => setData([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [page, search]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">🎁 Fidélité</h1><p className="text-slate-400 text-sm">{total} client(s) fidélité</p></div>
        <button onClick={() => { setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Points</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-right p-4">Points</th><th className="text-left p-4">Niveau</th><th className="text-left p-4">Dernière activité</th></tr></thead><tbody>{data.map(c => (
            <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.clientNom}</td><td className="p-4 text-right text-fuchsia-400 font-bold text-lg">{c.points || 0}</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${(c.points || 0) >= 1000 ? 'bg-yellow-500/20 text-yellow-400' : (c.points || 0) >= 500 ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-700 text-slate-300'}`}>{(c.points || 0) >= 1000 ? '💎 Or' : (c.points || 0) >= 500 ? '🥈 Argent' : '🥉 Bronze'}</span></td><td className="p-4 text-slate-300">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('fr-FR') : '-'}</td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <FideliteParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); }} onSuccess={load} />
    </div>
  );
}
