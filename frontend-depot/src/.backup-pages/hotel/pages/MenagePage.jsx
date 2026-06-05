import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const STATUTS_MENAGE = ['À faire', 'En cours', 'Terminé', 'Vérifié'];

const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-violet-500 text-white rounded-xl px-4 py-3 text-sm outline-none';

export default function MenagePage() {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ chambreNumero: '', agent: '', statut: 'À faire', priorite: 'Normale', notes: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true);
    try { const res = await api.get('/hotel/menage'); setTaches(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ chambreNumero: '', agent: '', statut: 'À faire', priorite: 'Normale', notes: '' }); setFormOpen(true); };
  const openEdit = (t) => { setEditItem(t); setForm({ chambreNumero: t.chambreNumero || '', agent: t.agent || '', statut: t.statut || 'À faire', priorite: t.priorite || 'Normale', notes: t.notes || '' }); setFormOpen(true); };

  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { if (editItem) await api.patch(`/hotel/menage/${editItem.id}`, form); else await api.post('/hotel/menage', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/hotel/menage/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const filtres = taches.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.chambreNumero?.toLowerCase().includes(q) || t.agent?.toLowerCase().includes(q);
    const matchStatut = !filtreStatut || t.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🧹 Ménage</h1>
          <p className="text-slate-400 text-sm mt-1">{taches.length} tâche{taches.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
          + Nouvelle Tâche
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Chambre ou agent..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-violet-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous statuts</option>
          {STATUTS_MENAGE.map(s => <option key={s} value={s}>{s}</option>)}
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
                <th className="text-left px-5 py-4">Agent</th>
                <th className="text-center px-5 py-4">Priorité</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune tâche trouvée</td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-black text-sm">🧹</div>
                      <span className="text-white font-semibold text-sm">Chambre {t.chambreNumero}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{t.agent || '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priorite === 'Urgente' ? 'bg-red-500/20 text-red-400' : t.priorite === 'Haute' ? 'bg-orange-500/20 text-orange-400' : t.priorite === 'Normale' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>{t.priorite || 'Normale'}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.statut === 'Terminé' ? 'bg-emerald-500/20 text-emerald-400' : t.statut === 'Vérifié' ? 'bg-blue-500/20 text-blue-400' : t.statut === 'En cours' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}`}>{t.statut}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(t)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                      <button onClick={() => setConfirmDelete(t)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} tâche{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
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

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier tâche' : '🧹 Nouvelle tâche'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Chambre *</label><input required value={form.chambreNumero} onChange={set('chambreNumero')} placeholder="N° chambre" className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Agent</label><input value={form.agent} onChange={set('agent')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={set('statut')} className={inputClass}>{STATUTS_MENAGE.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Priorité</label><select value={form.priorite} onChange={set('priorite')} className={inputClass}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><textarea value={form.notes} onChange={set('notes')} className={inputClass + ' h-20'} /></div>
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la tâche" message={`Supprimer la tâche de ménage (Ch. ${confirmDelete?.chambreNumero}) ? Cette action est irréversible.`} />
    </div>
  );
}
