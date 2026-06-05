import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import LotForm from '../forms/LotForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function LotsPage() {
  const [lots, setLots] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'lots');
  const itemsPerPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, m] = await Promise.all([api.get('/pharmacie/lots'), api.get('/pharmacie/medicaments')]);
      setLots(l.data?.data || l.data || []);
      setMedicaments(m.data?.data || m.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.patch(`/pharmacie/lots/${confirmDelete.id}`, { actif: false });
      showNotif('Lot supprimé ✓');
      setConfirmDelete(null);
      load();
    } catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const filtres = lots.filter(l => {
    const q = search.toLowerCase();
    const med = medicaments.find(m => m.id === l.medicamentId);
    return !q || l.numeroLot?.toLowerCase().includes(q) || med?.designation?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🔢 Lots & Traçabilité</h1>
          <p className="text-slate-400 text-sm mt-1">{lots.length} lot{ lots.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouveau Lot
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher un lot ou médicament..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Médicament</th>
                <th className="text-left px-5 py-4">N° Lot</th>
                <th className="text-center px-5 py-4">Expiration</th>
                <th className="text-right px-5 py-4">Quantité</th>
                <th className="text-center px-5 py-4">Statut DLC</th>
                {perm.canEdit && <th className="text-center px-5 py-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={perm.canEdit ? 6 : 5} className="text-center py-16 text-slate-500">Aucun lot trouvé</td></tr>
              ) : paginated.map(l => {
                const med = medicaments.find(m => m.id === l.medicamentId);
                const dlc = l.dateExpiration ? new Date(l.dateExpiration) : null;
                const now = new Date();
                const dlcStatus = !dlc ? 'neutre' : dlc <= now ? 'expire' : dlc <= new Date(now.getTime() + 7 * 86400000) ? 'urgent' : dlc <= new Date(now.getTime() + 30 * 86400000) ? 'bientot' : 'ok';
                const dlcColors = { expire: 'bg-red-500/20 text-red-400', urgent: 'bg-amber-500/20 text-amber-400', bientot: 'bg-yellow-500/20 text-yellow-400', ok: 'bg-emerald-500/20 text-emerald-400', neutre: 'bg-slate-700 text-slate-400' };
                return (
                  <tr key={l.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{med?.designation || '—'}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm font-mono">{l.numeroLot}</td>
                    <td className="px-5 py-4 text-center text-slate-300 text-sm">{dlc ? dlc.toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-4 text-right text-white font-bold text-sm">{l.quantite ?? 0}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${dlcColors[dlcStatus]}`}>
                        {dlcStatus === 'expire' ? 'Expiré' : dlcStatus === 'urgent' ? '< 7j' : dlcStatus === 'bientot' ? '< 30j' : dlcStatus === 'ok' ? 'OK' : '—'}
                      </span>
                    </td>
                    {perm.canEdit && (
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {perm.canEdit && (
                        <button onClick={() => { setEditItem(l); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                        )}
                        {perm.canDelete && (
                        <button onClick={() => setConfirmDelete(l)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>
                        )}
                      </div>
                    </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} lot{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && <LotForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Lot modifié ✓' : 'Lot créé ✓'); load(); }} edit={editItem} />}

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le lot"
          message={`Êtes-vous sûr de vouloir supprimer le lot "${confirmDelete.numeroLot}" ?`}
        />
      )}
    </div>
  );
}
