import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const SERVICE_ICONS = { LAVAGE: '🧺', NETTOYAGE_SEC: '🧴', REPASSAGE: '👔', PLIAGE: '📦', TACHES: '🔬', COUTURE: '🪡' };
const SERVICE_LABELS = { LAVAGE: 'Lavage', NETTOYAGE_SEC: 'Nettoyage à sec', REPASSAGE: 'Repassage', PLIAGE: 'Pliage', TACHES: 'Détachage', COUTURE: 'Couture' };
const LIMIT = 20;
export default function ServicesPage() {
  const [services, setServices] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: 'LAVAGE', nom: '', description: '', prix: '', delai: '24h' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/services', { params: { page, limit: LIMIT, search } }); setServices(r.data.data); setTotal(r.data.total); }
    catch { setServices([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setEditItem(null); setForm({ code: 'LAVAGE', nom: '', description: '', prix: '', delai: '24h' }); setFormOpen(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ code: s.code || 'LAVAGE', nom: s.nom || '', description: s.description || '', prix: s.prix || '', delai: s.delai || '24h' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/pressing/services/${editItem.id}`, form); else await api.post('/pressing/services', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/services/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const inputClass = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm';
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">🧼 Services</h1><p className="text-slate-400 text-sm">{total} service(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouveau service</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Type</th><th className="text-left p-4">Nom</th><th className="text-left p-4">Description</th><th className="text-right p-4">Prix (F)</th><th className="text-left p-4">Délai</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{services.map(s => (
            <tr key={s.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4"><span className="text-lg">{SERVICE_ICONS[s.code] || '🧼'}</span><span className="text-slate-400 text-xs ml-2">{SERVICE_LABELS[s.code] || s.code}</span></td><td className="p-4 text-white font-semibold">{s.nom}</td><td className="p-4 text-slate-300">{s.description || '-'}</td><td className="p-4 text-right text-white font-bold">{Number(s.prix || 0).toLocaleString('fr-FR')}</td><td className="p-4 text-slate-300">{s.delai || '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(s)} className="text-purple-400 hover:text-purple-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(s)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier service' : '🧼 Nouveau service'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Type</label><select value={form.code} onChange={set('code')} className={inputClass}>{Object.entries(SERVICE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        {['nom','description','prix','delai'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'nom' ? 'Nom' : f === 'description' ? 'Description' : f === 'prix' ? 'Prix (F)' : 'Délai'}</label><input type={f === 'prix' ? 'number' : 'text'} value={form[f]} onChange={set(f)} className={inputClass} required={f === 'nom' || f === 'prix'} /></div>
        ))}
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le service" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
