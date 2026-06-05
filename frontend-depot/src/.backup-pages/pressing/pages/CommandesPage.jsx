import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const STATUT_MAP = { EN_ATTENTE: 'En attente', CONFIRMEE: 'Confirmée', EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée' };
const STATUT_COLOR = { EN_ATTENTE: '#f59e0b', CONFIRMEE: '#3b82f6', EN_COURS: '#7c3aed', TERMINEE: '#10b981', ANNULEE: '#ef4444' };
const LIMIT = 20;
export default function CommandesPage() {
  const [commandes, setCommandes] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ clientNom: '', description: '', montant: '', statut: 'EN_ATTENTE', dateLivraison: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/commandes', { params: { page, limit: LIMIT, search } }); setCommandes(r.data.data); setTotal(r.data.total); }
    catch { setCommandes([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setForm({ clientNom: '', description: '', montant: '', statut: 'EN_ATTENTE', dateLivraison: '' }); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ clientNom: c.clientNom || '', description: c.description || '', montant: c.montant || '', statut: c.statut || 'EN_ATTENTE', dateLivraison: c.dateLivraison ? c.dateLivraison.split('T')[0] : '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/pressing/commandes/${editItem.id}`, form); else await api.post('/pressing/commandes', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/commandes/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm';
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📋 Commandes</h1><p className="text-slate-400 text-sm">{total} commande(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle commande</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Description</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Statut</th><th className="text-left p-4">Livraison</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{commandes.map(c => (
            <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.clientNom}</td><td className="p-4 text-slate-300">{c.description}</td><td className="p-4 text-right text-white font-bold">{Number(c.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full" style={{ backgroundColor: STATUT_COLOR[c.statut] + '22', color: STATUT_COLOR[c.statut] }}>{STATUT_MAP[c.statut] || c.statut}</span></td><td className="p-4 text-slate-300">{c.dateLivraison ? new Date(c.dateLivraison).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(c)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier commande' : '📋 Nouvelle commande'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        {['clientNom','description','montant','dateLivraison'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'clientNom' ? 'Client' : f === 'description' ? 'Description' : f === 'montant' ? 'Montant (F)' : 'Date livraison'}</label><input type={f === 'montant' ? 'number' : f === 'dateLivraison' ? 'date' : 'text'} value={form[f]} onChange={set(f)} className={inputClass} required={f !== 'dateLivraison'} /></div>
        ))}
        {editItem && <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Statut</label><select value={form.statut} onChange={set('statut')} className={inputClass}>{Object.entries(STATUT_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la commande" message={`Supprimer la commande de ${confirmDelete?.clientNom || ''} (${Number(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F) ?`} />
    </div>
  );
}
