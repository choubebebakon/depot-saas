import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import TicketPressingForm from '../forms/TicketPressingForm';
import RetraitPressingForm from '../forms/RetraitPressingForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const STATUS_MAP = { DEPOSE: 'Déposé', LAVE: 'Lavé', REPASSE: 'Repassé', PRET: 'Prêt', RETIRE: 'Retiré', ANNULE: 'Annulé' };
const STATUS_COLOR = { DEPOSE: '#7c3aed', LAVE: '#3b82f6', REPASSE: '#f59e0b', PRET: '#10b981', RETIRE: '#6b7280', ANNULE: '#ef4444' };
export default function TicketsPage() {
  const [tickets, setTickets] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [retraitOpen, setRetraitOpen] = useState(false); const [retraitTicket, setRetraitTicket] = useState(null);
  const limit = 20;
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/tickets', { params: { page, limit, search } }); setTickets(r.data.data); setTotal(r.data.total); }
    catch { setTickets([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (t) => { setEditItem(t); setFormOpen(true); };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/tickets/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">🏷️ Tickets Dépôts</h1><p className="text-slate-400 text-sm">{total} ticket(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouveau ticket</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher par client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Téléphone</th><th className="text-left p-4">Articles</th><th className="text-left p-4">Statut</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Retrait</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{tickets.map(t => (
            <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{t.clientNom}</td><td className="p-4 text-slate-300">{t.telephone}</td><td className="p-4 text-slate-300">{t.articles}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUS_COLOR[t.statut] + '22', color: STATUS_COLOR[t.statut] }}>{STATUS_MAP[t.statut] || t.statut}</span></td><td className="p-4 text-right text-white font-bold">{Number(t.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-slate-300">{t.dateRetrait ? new Date(t.dateRetrait).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(t)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => { setRetraitTicket(t); setRetraitOpen(true); }} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold">✅</button><button onClick={() => setConfirmDelete(t)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <TicketPressingForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} />
      <RetraitPressingForm isOpen={retraitOpen} onClose={() => setRetraitOpen(false)} onSuccess={() => load()} metier="pressing" ticket={retraitTicket} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le ticket" message={`Supprimer le ticket de ${confirmDelete?.clientNom || ''} ? Cette action est irréversible.`} />
    </div>
  );
}
