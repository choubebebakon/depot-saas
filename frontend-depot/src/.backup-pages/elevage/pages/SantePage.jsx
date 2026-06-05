import { useState, useEffect } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
export default function SantePage() {
  const [soins, setSoins] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'sante'); const itemsPerPage = 20;
  const load = async () => { setLoading(true); try { const res = await api.get('/elevage/evenements'); setSoins((res.data?.data || res.data || []).filter(e => ['Vaccination','Déparasitage','Examen vétérinaire'].includes(e.type))); } catch (_) {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtres = soins.filter(s => { const q = search.toLowerCase(); return !q || s.animalId?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage); const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">💉 Santé</h1><p className="text-slate-400 text-sm mt-1">{soins.length} soin{soins.length !== 1 ? 's' : ''}</p></div>
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Animal, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-lime-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Animal</th><th className="text-left px-5 py-4">Type</th><th className="text-center px-5 py-4">Date</th><th className="text-right px-5 py-4">Coût</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun soin trouvé</td></tr>
              : paginated.map(s => (
                <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{s.animalId || '—'}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400">{s.type}</span></td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(s.cout || 0).toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} soin{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-lime-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
