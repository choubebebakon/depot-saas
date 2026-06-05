import { useState, useEffect } from 'react'; import api from '../../../api';
import StockMouvementParfumerieForm from '../forms/StockMouvementParfumerieForm';
export default function StockPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false);
  const limit = 20;
  const load = () => { setLoading(true); api.get('/parfumerie/stock', { params: { page, limit, search } }).then(r => { setData(r.data.data); setTotal(r.data.total); }).catch(() => setData([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [page, search]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📦 Mouvements de Stock</h1><p className="text-slate-400 text-sm">{total} mouvement(s)</p></div>
        <button onClick={() => { setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Mouvement</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher produit..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Produit</th><th className="text-left p-4">Type</th><th className="text-right p-4">Qté</th><th className="text-left p-4">Motif</th><th className="text-left p-4">Date</th></tr></thead><tbody>{data.map(item => (
            <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{item.produitNom}</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${item.type === 'ENTREE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.type}</span></td><td className="p-4 text-right text-white font-bold">{item.quantite}</td><td className="p-4 text-slate-300">{item.motif || '-'}</td><td className="p-4 text-slate-300">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '-'}</td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <StockMouvementParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); }} onSuccess={load} />
    </div>
  );
}
