import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const OPERATEURS = ['Orange', 'MTN', 'Moov', 'Airtel', 'YooMee', 'Camtel'];
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function RechargesPage() {
  const [recharges, setRecharges] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreOperateur, setFiltreOperateur] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ operateur: 'Orange', clientId: '', numero: '', montant: '', commission: 0, dateRecharge: '' });
  const [clients, setClients] = useState([]); const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'recharges'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/recharges'); setRecharges(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ operateur: 'Orange', clientId: '', numero: '', montant: '', commission: 0, dateRecharge: '' }); api.get('/telephonie/clients').then(r => setClients(r.data?.data || r.data || [])).catch(() => {}); setFormOpen(true); };
  const openEdit = (r) => { setEditItem(r); setForm({ operateur: r.operateur || 'Orange', clientId: r.clientId || '', numero: r.numero || '', montant: r.montant || '', commission: r.commission || 0, dateRecharge: r.dateRecharge || '' }); api.get('/telephonie/clients').then(r => setClients(r.data?.data || r.data || [])).catch(() => {}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/telephonie/recharges/${editItem.id}`, form); else await api.post('/telephonie/recharges', form); setFormOpen(false); showNotif(editItem ? 'Recharge modifiée ✓' : 'Recharge créée ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/recharges/${confirmDelete.id}`); showNotif('Recharge supprimée ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = recharges.filter(r => { const q = search.toLowerCase(); const matchSearch = !q || r.numero?.includes(q) || r.operateur?.toLowerCase().includes(q); const matchO = !filtreOperateur || r.operateur === filtreOperateur; return matchSearch && matchO; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🔋 Recharges</h1><p className="text-slate-400 text-sm mt-1">{recharges.length} recharge{recharges.length !== 1 ? 's' : ''} — Total {recharges.reduce((s, r) => s + (r.montant || 0), 0).toLocaleString('fr-FR')} F</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouvelle Recharge</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Numéro, opérateur..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreOperateur} onChange={e => { setFiltreOperateur(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous opérateurs</option>{OPERATEURS.map(o => <option key={o} value={o}>{o}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Numéro</th><th className="text-left px-5 py-4">Opérateur</th><th className="text-right px-5 py-4">Montant</th><th className="text-right px-5 py-4">Commission</th><th className="text-center px-5 py-4">Date</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune recharge trouvée</td></tr>
              : paginated.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-mono font-bold text-sm">{r.numero}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{r.operateur}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(r.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-right text-slate-300 text-sm">{(r.commission || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{r.dateRecharge ? new Date(r.dateRecharge).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(r)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(r)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} recharge{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier recharge' : '🔋 Nouvelle recharge'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Opérateur</label><select value={form.operateur} onChange={setF('operateur')} className={inputClass}>{OPERATEURS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client</label><select value={form.clientId} onChange={setF('clientId')} className={inputClass}><option value="">Aucun</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Numéro *</label><input required value={form.numero} onChange={setF('numero')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F)</label><input type="number" value={form.montant} onChange={setF('montant')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Commission (F)</label><input type="number" value={form.commission} onChange={setF('commission')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date</label><input type="date" value={form.dateRecharge} onChange={setF('dateRecharge')} className={inputClass} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer la recharge" message={`Êtes-vous sûr de vouloir supprimer cette recharge ?`} />
    </div>
  );
}
