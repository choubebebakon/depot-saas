import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import ContratLocationForm from '../forms/ContratLocationForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function ContratsPage() {
  const [contrats, setContrats] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'contrats'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/immobilier/contrats'); setContrats(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/immobilier/contrats/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const filtres = contrats.filter(c => { const q = search.toLowerCase(); return !q || c.bien?.nom?.toLowerCase().includes(q) || c.locataire?.nom?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📋 Contrats</h1><p className="text-slate-400 text-sm mt-1">{contrats.length} contrat{contrats.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-teal-600/20">+ Nouveau Contrat</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Bien ou locataire..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Bien</th><th className="text-left px-5 py-4">Locataire</th><th className="text-left px-5 py-4">Début</th><th className="text-left px-5 py-4">Fin</th><th className="text-right px-5 py-4">Loyer</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucun contrat trouvé</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><span className="text-white font-semibold text-sm">{c.bien?.nom || '—'}</span></td>
                  <td className="px-5 py-4 text-slate-300">{c.locataire?.nom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{c.loyer ? `${(c.loyer).toLocaleString('fr-FR')} F` : '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${c.statut === 'ACTIF' ? 'bg-green-500/20 text-green-400' : c.statut === 'RESILIE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>{c.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} contrat{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <ContratLocationForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="immobilier" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le contrat" message={`Supprimer le contrat pour « ${confirmDelete?.bien?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
