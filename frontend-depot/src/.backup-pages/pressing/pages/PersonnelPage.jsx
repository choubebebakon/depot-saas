import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const LIMIT = 20;
export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', role: 'LAVETIER', telephone: '', email: '', salaire: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/personnel', { params: { page, limit: LIMIT, search } }); setPersonnel(r.data.data); setTotal(r.data.total); }
    catch { setPersonnel([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setForm({ nom: '', role: 'LAVETIER', telephone: '', email: '', salaire: '' }); setFormOpen(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ nom: p.nom || '', role: p.role || 'LAVETIER', telephone: p.telephone || '', email: p.email || '', salaire: p.salaire || '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/pressing/personnel/${editItem.id}`, form); else await api.post('/pressing/personnel', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/personnel/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm';
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">👥 Personnel</h1><p className="text-slate-400 text-sm">{total} employé(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvel employé</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Nom</th><th className="text-left p-4">Rôle</th><th className="text-left p-4">Téléphone</th><th className="text-left p-4">Email</th><th className="text-right p-4">Salaire</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{personnel.map(p => (
            <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{p.nom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{p.role}</span></td><td className="p-4 text-slate-300">{p.telephone || '-'}</td><td className="p-4 text-slate-300">{p.email || '-'}</td><td className="p-4 text-right text-white font-bold">{Number(p.salaire || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(p)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier employé' : '👥 Nouvel employé'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Rôle</label><select value={form.role} onChange={set('role')} className={inputClass}><option value="GERANT">Gérant</option><option value="RECEPTEUR">Récepteur</option><option value="LAVETIER">Lavetier</option><option value="LIVREUR">Livreur</option></select></div>
        {['nom','telephone','email','salaire'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'nom' ? 'Nom' : f === 'telephone' ? 'Téléphone' : f === 'email' ? 'Email' : 'Salaire (F)'}</label><input type={f === 'email' ? 'email' : f === 'salaire' ? 'number' : 'text'} value={form[f]} onChange={set(f)} className={inputClass} required={f === 'nom'} /></div>
        ))}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer l'employé" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
