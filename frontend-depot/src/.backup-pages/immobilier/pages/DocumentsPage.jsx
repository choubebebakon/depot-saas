import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function DocumentsPage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ titre: '', type: 'CONTRAT', bienId: '', fichier: '', notes: '' }); const [formLoading, setFormLoading] = useState(false); const [formError, setFormError] = useState('');
  const [biens, setBiens] = useState([]);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'documents'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/immobilier/documents'); setItems(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (formOpen) api.get('/immobilier/biens').then(r => setBiens(r.data?.data || r.data || [])).catch(() => {}); }, [formOpen]);
  const openCreate = () => { setEditItem(null); setFormData({ titre: '', type: 'CONTRAT', bienId: '', fichier: '', notes: '' }); setFormError(''); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormData({ titre: item.titre || '', type: item.type || 'CONTRAT', bienId: item.bienId || '', fichier: item.fichier || '', notes: item.notes || '' }); setFormError(''); setFormOpen(true); };
  const handleFormSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/immobilier/documents/${editItem.id}`, formData); else await api.post('/immobilier/documents', formData); setFormOpen(false); load(); } catch (err) { setFormError(err.response?.data?.message || 'Erreur'); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/immobilier/documents/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const set = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });
  const filtres = items.filter(i => { const q = search.toLowerCase(); return !q || i.titre?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q) || i.bien?.nom?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-teal-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📄 Documents</h1><p className="text-slate-400 text-sm mt-1">{items.length} document{items.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-teal-600/20">+ Nouveau Document</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Titre, type ou bien..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Titre</th><th className="text-left px-5 py-4">Type</th><th className="text-left px-5 py-4">Bien</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun document</td></tr>
              : paginated.map(i => (
                <tr key={i.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-teal-600/20 rounded-xl flex items-center justify-center text-teal-400 font-black text-sm">📄</div><span className="text-white font-semibold text-sm">{i.titre}</span></div></td>
                  <td className="px-5 py-4"><span className="text-xs px-2 py-1 rounded-lg bg-slate-700 text-slate-300">{i.type}</span></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{i.bien?.nom || '—'}</td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(i)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} document{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1"><button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">◀</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}<button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">▶</button></div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} title={editItem ? '✏️ Modifier document' : '📄 Nouveau document'} loading={formLoading}>
        {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formError}</div>}
        <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Titre *</label><input required value={formData.titre} onChange={set('titre')} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Type</label><select value={formData.type} onChange={set('type')} className={inputClass}><option value="CONTRAT">Contrat</option><option value="QUITTANCE">Quittance</option><option value="FACTURE">Facture</option><option value="ETAT_LIEUX">État des lieux</option><option value="PROCES_VERBAL">Procès-verbal</option><option value="AUTRE">Autre</option></select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Bien lié</label><select value={formData.bienId} onChange={set('bienId')} className={inputClass}><option value="">Sélectionner</option>{biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}</select></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fichier (URL)</label><input value={formData.fichier} onChange={set('fichier')} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><textarea value={formData.notes} onChange={set('notes')} className={inputClass} rows={2} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le document" message={`Supprimer « ${confirmDelete?.titre} » ? Cette action est irréversible.`} />
    </div>
  );
}
