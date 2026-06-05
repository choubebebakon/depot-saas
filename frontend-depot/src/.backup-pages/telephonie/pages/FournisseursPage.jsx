import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FournisseurForm from '../../../shared/forms/FournisseurForm'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'fournisseurs'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/fournisseurs'); setFournisseurs(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/fournisseurs/${confirmDelete.id}`); showNotif('Fournisseur supprimé ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  const filtres = fournisseurs.filter(f => { const q = search.toLowerCase(); return !q || f.nom?.toLowerCase().includes(q) || f.specialite?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🏭 Fournisseurs</h1><p className="text-slate-400 text-sm mt-1">{fournisseurs.length} fournisseur{fournisseurs.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouveau Fournisseur</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Nom ou spécialité..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Fournisseur</th><th className="text-left px-5 py-4">Spécialité</th><th className="text-left px-5 py-4">Téléphone</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun fournisseur trouvé</td></tr>
              : paginated.map(f => (
                <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-black text-sm">{f.nom?.slice(0, 2).toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{f.nom}</p></div></div></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{f.specialite || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{f.telephone || '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => { setEditItem(f); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(f)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} fournisseur{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <FournisseurForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Fournisseur modifié ✓' : 'Fournisseur créé ✓'); load(); }} edit={editItem} metier="telephonie" />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer le fournisseur" message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.nom}" ?`} />
    </div>
  );
}
