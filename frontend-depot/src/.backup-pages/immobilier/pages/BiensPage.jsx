import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import BienImmobilierForm from '../forms/BienImmobilierForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function BiensPage() {
  const [biens, setBiens] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'biens'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/immobilier/biens'); setBiens(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/immobilier/biens/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const filtres = biens.filter(b => { const q = search.toLowerCase(); return !q || b.nom?.toLowerCase().includes(q) || b.adresse?.toLowerCase().includes(q) || b.type?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🏠 Biens Immobiliers</h1><p className="text-slate-400 text-sm mt-1">{biens.length} bien{biens.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-teal-600/20">+ Nouveau Bien</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Nom, adresse ou type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Bien</th><th className="text-left px-5 py-4">Type</th><th className="text-right px-5 py-4">Superficie</th><th className="text-right px-5 py-4">Loyer</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun bien trouvé</td></tr>
              : paginated.map(b => (
                <tr key={b.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-teal-600/20 rounded-xl flex items-center justify-center text-teal-400 font-black text-sm">{b.nom?.slice(0, 2).toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{b.nom}</p>{b.adresse && <p className="text-slate-500 text-xs">{b.adresse}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-xs px-2 py-1 rounded-lg bg-slate-700 text-slate-300">{b.type}</span></td>
                  <td className="px-5 py-4 text-right text-slate-300 text-sm">{b.superficie ? `${b.superficie} m²` : '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{b.loyer ? `${(b.loyer).toLocaleString('fr-FR')} F` : '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${b.statut === 'LOUE' ? 'bg-green-500/20 text-green-400' : b.statut === 'LIBRE' ? 'bg-blue-500/20 text-blue-400' : b.statut === 'TRAVAUX' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>{b.statut}</span></td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      {perm.canEdit && <button onClick={() => { setEditItem(b); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(b)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} bien{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <BienImmobilierForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="immobilier" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le bien" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
