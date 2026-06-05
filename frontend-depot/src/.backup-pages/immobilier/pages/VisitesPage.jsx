import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function VisitesPage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ bienId: '', clientNom: '', clientTel: '', dateVisite: '', heure: '', statut: 'PREVUE', notes: '' }); const [formLoading, setFormLoading] = useState(false); const [formError, setFormError] = useState('');
  const [biens, setBiens] = useState([]);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'visites'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/immobilier/visites'); setItems(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (formOpen) api.get('/immobilier/biens').then(r => setBiens(r.data?.data || r.data || [])).catch(() => {}); }, [formOpen]);
  const openCreate = () => { setEditItem(null); setFormData({ bienId: '', clientNom: '', clientTel: '', dateVisite: '', heure: '', statut: 'PREVUE', notes: '' }); setFormError(''); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormData({ bienId: item.bienId || '', clientNom: item.clientNom || '', clientTel: item.clientTel || '', dateVisite: item.dateVisite?.split('T')[0] || '', heure: item.heure || '', statut: item.statut || 'PREVUE', notes: item.notes || '' }); setFormError(''); setFormOpen(true); };
  const handleFormSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/immobilier/visites/${editItem.id}`, formData); else await api.post('/immobilier/visites', formData); setFormOpen(false); load(); } catch (err) { setFormError(err.response?.data?.message || 'Erreur'); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/immobilier/visites/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const set = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });
  const filtres = items.filter(i => { const q = search.toLowerCase(); return !q || i.clientNom?.toLowerCase().includes(q) || i.bien?.nom?.toLowerCase().includes(q) || i.statut?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-teal-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📅 Visites</h1><p className="text-slate-400 text-sm mt-1">{items.length} visite{items.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-teal-600/20">+ Nouvelle Visite</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Client, bien..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Bien</th><th className="text-left px-5 py-4">Client</th><th className="text-left px-5 py-4">Téléphone</th><th className="text-left px-5 py-4">Date</th><th className="text-left px-5 py-4">Heure</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucune visite</td></tr>
              : paginated.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{i.bien?.nom || '—'}</td>
                  <td className="px-5 py-4 text-white">{i.clientNom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300">{i.clientTel || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{i.dateVisite ? new Date(i.dateVisite).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-slate-300">{i.heure || '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${i.statut === 'EFFECTUEE' ? 'bg-green-500/20 text-green-400' : i.statut === 'PREVUE' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{i.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(i)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} visite{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1"><button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">◀</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}<button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">▶</button></div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} title={editItem ? '✏️ Modifier visite' : '📅 Nouvelle visite'} loading={formLoading}>
        {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formError}</div>}
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Bien *</label><select required value={formData.bienId} onChange={set('bienId')} className={inputClass}><option value="">Sélectionner</option>{biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client *</label><input required value={formData.clientNom} onChange={set('clientNom')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input value={formData.clientTel} onChange={set('clientTel')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date</label><input type="date" value={formData.dateVisite} onChange={set('dateVisite')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Heure</label><input type="time" value={formData.heure} onChange={set('heure')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={formData.statut} onChange={set('statut')} className={inputClass}><option value="PREVUE">Prévue</option><option value="EFFECTUEE">Effectuée</option><option value="ANNULEE">Annulée</option></select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><textarea value={formData.notes} onChange={set('notes')} className={inputClass} rows={2} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer la visite" message={`Supprimer la visite de « ${confirmDelete?.clientNom} » ? Cette action est irréversible.`} />
    </div>
  );
}
