import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import ConsommationHotelForm from '../forms/ConsommationHotelForm';

const TYPES_SERVICE = ['Room Service', 'Spa', 'Blanchisserie', 'Navette', 'Petit-déjeuner', 'Mini-bar', 'Autre'];

const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 text-sm outline-none';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [consoOpen, setConsoOpen] = useState(false); const [consoReservation, setConsoReservation] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ chambreNumero: '', type: 'Room Service', description: '', montant: '', statut: 'Commandé', date: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true);
    try { const res = await api.get('/hotel/services'); setServices(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ chambreNumero: '', type: 'Room Service', description: '', montant: '', statut: 'Commandé', date: '' }); setFormOpen(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ chambreNumero: s.chambreNumero || '', type: s.type || 'Room Service', description: s.description || '', montant: s.montant || '', statut: s.statut || 'Commandé', date: s.date || '' }); setFormOpen(true); };

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/hotel/services/${editItem.id}`, form); else await api.post('/hotel/services', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/hotel/services/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const filtres = services.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.chambreNumero?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchType = !filtreType || s.type === filtreType;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🛎️ Services</h1>
          <p className="text-slate-400 text-sm mt-1">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
          + Nouveau Service
        </button>
        <button onClick={() => setConsoOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          🍽️ Consommation
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Chambre, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-violet-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous types</option>
          {TYPES_SERVICE.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Chambre</th>
                <th className="text-left px-5 py-4">Type</th>
                <th className="text-left px-5 py-4">Description</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun service trouvé</td></tr>
              ) : paginated.map(s => (
                <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-black text-sm">🛎️</div>
                      <span className="text-white font-semibold text-sm">N° {s.chambreNumero}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{s.type}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm max-w-[200px] truncate">{s.description || '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(s.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.statut === 'Livré' ? 'bg-emerald-500/20 text-emerald-400' : s.statut === 'En préparation' ? 'bg-yellow-500/20 text-yellow-400' : s.statut === 'Annulé' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{s.statut}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(s)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                      <button onClick={() => setConfirmDelete(s)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} service{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier service' : '🛎️ Nouveau service'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Chambre *</label><input required value={form.chambreNumero} onChange={set('chambreNumero')} placeholder="N° chambre" className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type *</label><select value={form.type} onChange={set('type')} className={inputClass}>{TYPES_SERVICE.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F)</label><input type="number" value={form.montant} onChange={set('montant')} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Description</label><input value={form.description} onChange={set('description')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={set('statut')} className={inputClass}><option>Commandé</option><option>En préparation</option><option>Livré</option><option>Annulé</option></select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date</label><input type="date" value={form.date} onChange={set('date')} className={inputClass} /></div>
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le service" message={`Supprimer le service « ${confirmDelete?.type} » (Ch. ${confirmDelete?.chambreNumero}) ? Cette action est irréversible.`} />
      <ConsommationHotelForm isOpen={consoOpen} onClose={() => setConsoOpen(false)} onSuccess={() => load()} metier="hotel" reservation={consoReservation} />
    </div>
  );
}
