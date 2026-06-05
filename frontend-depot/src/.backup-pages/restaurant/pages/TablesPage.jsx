import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import TableForm from '../forms/TableForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const ZONES = ['Salle principale', 'Terrasse', 'VIP', 'Bar', 'Salon privé'];

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/restaurant/tables'); setTables(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/restaurant/tables/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const paginated = tables.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(tables.length / itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🍽️ Tables</h1><p className="text-slate-400 text-sm mt-1">{tables.length} table{tables.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">+ Nouvelle Table</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Table</th>
                <th className="text-center px-5 py-4">Capacité</th>
                <th className="text-center px-5 py-4">Zone</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune table</td></tr>
              : paginated.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-sm">{t.numero}</div><span className="text-white font-semibold text-sm">Table {t.numero}</span></div></td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{t.capacite} pers.</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{t.zone}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.statut === 'Libre' ? 'bg-emerald-500/20 text-emerald-400' : t.statut === 'Occupée' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{t.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => { setEditItem(t); setFormOpen(true); }} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(t)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{tables.length} tables — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <TableForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="restaurant" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la table" message={`Supprimer la table « ${confirmDelete?.numero} » ? Cette action est irréversible.`} />
    </div>
  );
}
