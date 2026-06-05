import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function DevisPage() {
  const [devis, setDevis] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ ordreId: '', libelle: '', montant: '', description: '', validite: 30 });
  const [formLoading, setFormLoading] = useState(false); const [formErrors, setFormErrors] = useState({});
  const [ordres, setOrdres] = useState([]);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'devis'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/devis'); setDevis(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/garage/fiches-travaux').then(res => setOrdres(res.data?.data || res.data || [])).catch(() => {}); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ ordreId: '', libelle: '', montant: '', description: '', validite: 30 }); setFormErrors({}); setFormOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ ordreId: d.ordreId || '', libelle: d.libelle || '', montant: d.montant || '', description: d.description || '', validite: d.validite || 30 }); setFormErrors({}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/garage/devis/${editItem.id}`, form); else await api.post('/garage/devis', form); showNotif(editItem ? 'Devis modifié ✓' : 'Devis créé ✓'); setFormOpen(false); load(); } catch (err) { setFormErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/devis/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Devis supprimé ✓'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setFormField = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = devis.filter(d => { const q = search.toLowerCase(); return !q || d.libelle?.toLowerCase().includes(q) || (d.montant || '').toString().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📄 Devis</h1><p className="text-slate-400 text-sm mt-1">{devis.length} devis</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouveau Devis</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Libellé</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Validité</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={4} className="text-center py-16 text-slate-500">Aucun devis trouvé</td></tr>
              : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{d.libelle}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{d.validite ? `${d.validite} jours` : '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(d)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(d)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} devis — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier devis' : '📄 Nouveau devis'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        {formErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formErrors.general}</div>}
        <FormField label="Ordre de réparation" name="ordreId" type="select" value={form.ordreId} onChange={setFormField('ordreId')} options={ordres.map(o => ({ value: o.id, label: o.reference || `#${o.id}` }))} />
        <FormField label="Libellé" name="libelle" value={form.libelle} onChange={setFormField('libelle')} required placeholder="Libellé du devis" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={setFormField('montant')} min={0} unit="F" />
          <FormField label="Validité" name="validite" type="number" value={form.validite} onChange={setFormField('validite')} min={1} unit="jours" />
        </div>
        <FormField label="Description" name="description" type="textarea" value={form.description} onChange={setFormField('description')} rows={2} />
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le devis" message={`Supprimer « ${confirmDelete?.libelle} » ? Cette action est irréversible.`} />
    </div>
  );
}
