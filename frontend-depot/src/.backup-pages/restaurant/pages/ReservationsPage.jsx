import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import ReservationRestaurantForm from '../forms/ReservationRestaurantForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'reservations');
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/restaurant/reservations'); setReservations(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/restaurant/reservations/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const filtres = reservations.filter(r => { const q = search.toLowerCase(); return !q || r.clientNom?.toLowerCase().includes(q) || r.clientTel?.includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📅 Réservations</h1><p className="text-slate-400 text-sm mt-1">{reservations.length} réservation{reservations.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">+ Nouvelle Réservation</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-red-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" /></div>
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Client</th><th className="text-center px-5 py-4">Personnes</th><th className="text-center px-5 py-4">Date</th><th className="text-center px-5 py-4">Heure</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune réservation</td></tr>
              : paginated.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-sm">{r.clientNom?.[0]?.toUpperCase()}</div><span className="text-white font-semibold text-sm">{r.clientNom}</span></div></td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{r.nbPersonnes} pers.</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm font-mono">{r.heure || '20:00'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.statut === 'Confirmée' ? 'bg-emerald-500/20 text-emerald-400' : r.statut === 'En attente' ? 'bg-yellow-500/20 text-yellow-400' : r.statut === 'Terminée' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{r.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-2">{perm.canEdit && <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button>}<button onClick={() => setConfirmDelete(r)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} réservation{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <ReservationRestaurantForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="restaurant" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la réservation" message={`Supprimer la réservation de « ${confirmDelete?.clientNom} » ? Cette action est irréversible.`} />
    </div>
  );
}
