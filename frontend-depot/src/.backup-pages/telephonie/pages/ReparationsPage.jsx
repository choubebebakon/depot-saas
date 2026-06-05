import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import ReparationTelephoneForm from '../forms/ReparationTelephoneForm'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const STATUTS_REP = ['RECU', 'EN_DIAGNOSTIC', 'DEVIS_ENVOYE', 'EN_REPARATION', 'EN_ATTENTE_PIECES', 'PRET', 'LIVRE', 'ANNULE'];
export default function ReparationsPage() {
  const [reparations, setReparations] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreStatut, setFiltreStatut] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'reparations'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/reparations'); setReparations(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleStatut = async (r, newStatut) => { try { await api.patch(`/telephonie/reparations/${r.id}/statut`, { statut: newStatut }); showNotif('Statut mis à jour'); load(); } catch (_) { showNotif('Erreur', 'error'); } };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/reparations/${confirmDelete.id}`); showNotif('Réparation supprimée ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  const filtres = reparations.filter(r => { const q = search.toLowerCase(); const matchSearch = !q || r.panne?.toLowerCase().includes(q) || r.telephone?.modele?.toLowerCase().includes(q); const matchS = !filtreStatut || r.statut === filtreStatut; return matchSearch && matchS; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🔧 Réparations</h1><p className="text-slate-400 text-sm mt-1">{reparations.length} réparation{reparations.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouvelle Réparation</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Panne, téléphone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous statuts</option>{STATUTS_REP.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Téléphone</th><th className="text-left px-5 py-4">Client</th><th className="text-left px-5 py-4">Panne</th><th className="text-center px-5 py-4">Statut</th><th className="text-right px-5 py-4">Coût</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune réparation trouvée</td></tr>
              : paginated.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{r.telephone?.marque} {r.telephone?.modele || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{r.client?.nom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm max-w-[200px] truncate">{r.panne}</td>
                  <td className="px-5 py-4 text-center">
                    <select value={r.statut} onChange={e => handleStatut(r, e.target.value)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-purple-400 border border-purple-500/30">
                      {STATUTS_REP.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(r.cout || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => { setEditItem(r); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(r)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} réparation{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ReparationTelephoneForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Réparation modifiée ✓' : 'Réparation créée ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer la réparation" message={`Êtes-vous sûr de vouloir supprimer cette réparation ?`} />
    </div>
  );
}
