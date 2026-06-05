import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import ClientForm from '../../../shared/forms/ClientForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function ClientsPage() {
  const [clients, setClients] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'clients'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/clients'); setClients(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/clients/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Client supprimé ✓'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const filtres = clients.filter(c => { const q = search.toLowerCase(); return !q || c.nom?.toLowerCase().includes(q) || c.prenom?.toLowerCase().includes(q) || c.telephone?.includes(q) || c.email?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">👤 Clients</h1><p className="text-slate-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouveau Client</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Nom, téléphone ou email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Client</th><th className="text-left px-5 py-4">Téléphone</th><th className="text-left px-5 py-4">Email</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun client trouvé</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 font-black text-sm">{(c.nom?.[0] || '?').toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{c.nom} {c.prenom || ''}</p></div></div></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.telephone || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.email || '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(c)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} client{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Client modifié ✓' : 'Client créé ✓'); load(); }} edit={editItem} metier="garage" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le client" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
