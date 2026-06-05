import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const CATEGORIES = ['Loyer', 'Électricité', 'Eau', 'Fournitures', 'Salaire', 'Taxe', 'Entretien', 'Marketing', 'Assurance', 'Autre'];
const MODES_PAIEMENT = ['Espèces', 'Mobile Money', 'Virement', 'Carte'];
export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreCat, setFiltreCat] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ libelle: '', categorie: 'Autre', montant: '', dateDepense: '', modePaiement: 'Espèces', notes: '' });
  const [formLoading, setFormLoading] = useState(false); const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'depenses'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/depenses'); setDepenses(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ libelle: '', categorie: 'Autre', montant: '', dateDepense: '', modePaiement: 'Espèces', notes: '' }); setFormErrors({}); setFormOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ libelle: d.libelle || '', categorie: d.categorie || 'Autre', montant: d.montant || '', dateDepense: d.dateDepense || '', modePaiement: d.modePaiement || 'Espèces', notes: d.notes || '' }); setFormErrors({}); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/garage/depenses/${editItem.id}`, form); else await api.post('/garage/depenses', form); showNotif(editItem ? 'Dépense modifiée ✓' : 'Dépense créée ✓'); setFormOpen(false); load(); } catch (err) { setFormErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/depenses/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Dépense supprimée ✓'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setFormField = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = depenses.filter(d => { const q = search.toLowerCase(); const matchSearch = !q || d.libelle?.toLowerCase().includes(q) || d.categorie?.toLowerCase().includes(q); const matchC = !filtreCat || d.categorie === filtreCat; return matchSearch && matchC; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">💸 Dépenses</h1><p className="text-slate-400 text-sm mt-1">{depenses.length} dépense{depenses.length !== 1 ? 's' : ''} — Total {depenses.reduce((s, d) => s + (d.montant || 0), 0).toLocaleString('fr-FR')} F</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouvelle Dépense</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Libellé ou catégorie..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreCat} onChange={e => { setFiltreCat(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes catégories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Libellé</th><th className="text-left px-5 py-4">Catégorie</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Date</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune dépense trouvée</td></tr>
              : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{d.libelle}</td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{d.categorie}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{d.dateDepense ? new Date(d.dateDepense).toLocaleDateString('fr-FR') : '—'}</td>
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
              <span className="text-slate-400 text-xs">{filtres.length} dépense{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier dépense' : '💸 Nouvelle dépense'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        {formErrors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formErrors.general}</div>}
        <FormField label="Libellé" name="libelle" value={form.libelle} onChange={setFormField('libelle')} required placeholder="Libellé de la dépense" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Catégorie" name="categorie" type="select" value={form.categorie} onChange={setFormField('categorie')} options={CATEGORIES} />
          <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={setFormField('montant')} min={0} unit="F" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Date" name="dateDepense" type="date" value={form.dateDepense} onChange={setFormField('dateDepense')} />
          <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={setFormField('modePaiement')} options={MODES_PAIEMENT} />
        </div>
        <FormField label="Notes" name="notes" value={form.notes} onChange={setFormField('notes')} placeholder="Notes optionnelles..." />
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la dépense" message={`Supprimer « ${confirmDelete?.libelle} » ? Cette action est irréversible.`} />
    </div>
  );
}
