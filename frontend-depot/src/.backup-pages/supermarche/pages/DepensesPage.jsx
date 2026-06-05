import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

const CATEGORIES = [
  'Charges fixes',
  'Charges variables',
  'Personnel',
  'Énergie',
  'Loyer',
  'Transport',
  'Maintenance',
  'Marketing',
  'Taxes / Impôts',
  'Autre',
];

export default function DepensesPage() {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFiltre, setCatFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ libelle: '', montant: '', categorie: CATEGORIES[0], date: new Date().toISOString().slice(0, 10), modePaiement: 'cash', notes: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const perm = usePermission(PERMISSIONS, 'depenses');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true);
    try { const res = await api.get('/supermarche/depenses'); setDepenses(res.data?.data || res.data || []); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const openCreate = () => { setEditItem(null); setForm({ libelle: '', montant: '', categorie: CATEGORIES[0], date: new Date().toISOString().slice(0, 10), modePaiement: 'cash', notes: '' }); setFormOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ libelle: d.libelle || '', montant: d.montant || '', categorie: d.categorie || CATEGORIES[0], date: d.date?.slice(0, 10) || '', modePaiement: d.modePaiement || 'cash', notes: d.notes || '' }); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/supermarche/depenses/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Dépense supprimée'); load(); }
    catch { showNotif('Erreur suppression', 'error'); } finally { setDeleting(false); }
  };

  const handleSubmit = async (e) => { e.preventDefault(); setFormLoading(true);
    try {
      const payload = { ...form, montant: parseFloat(form.montant) };
      if (editItem) await api.patch(`/supermarche/depenses/${editItem.id}`, payload);
      else await api.post('/supermarche/depenses', payload);
      setFormOpen(false); showNotif(editItem ? 'Dépense modifiée ✓' : 'Dépense enregistrée ✓'); load();
    } catch { showNotif('Erreur lors de l\'enregistrement', 'error'); } finally { setFormLoading(false); }
  };

  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const filtres = depenses.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.libelle?.toLowerCase().includes(q) || d.categorie?.toLowerCase().includes(q);
    const matchCat = !catFiltre || d.categorie === catFiltre;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const totalFiltre = filtres.reduce((s, d) => s + (d.montant || 0), 0);

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">💸 Dépenses</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} dépense{filtres.length !== 1 ? 's' : ''} — Total: <span className="text-red-400 font-bold">{totalFiltre.toLocaleString('fr-FR')} F</span></p>
        </div>
        {perm.canCreate && (
        <button onClick={openCreate}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">
          + Nouvelle Dépense
        </button>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-56" />
        <select value={catFiltre} onChange={e => setCatFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Libellé</th>
                <th className="text-left px-5 py-4">Catégorie</th>
                <th className="text-left px-5 py-4">Paiement</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucune dépense enregistrée</td></tr>
              ) : paginated.map(d => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3 text-slate-300 text-sm whitespace-nowrap">{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-white font-semibold text-sm">{d.libelle}</p>
                    {d.notes && <p className="text-slate-500 text-xs">{d.notes}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">{d.categorie}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm">{d.modePaiement || '—'}</td>
                  <td className="px-5 py-3 text-right text-red-400 font-bold text-sm">{(d.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {perm.canEdit && (
                      <button onClick={() => openEdit(d)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                      )}
                      {perm.canDelete && (
                      <button onClick={() => setConfirmDelete(d)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>
                      )}
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
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier la dépense' : '💸 Nouvelle dépense'} loading={formLoading} submitLabel={editItem ? 'Modifier' : 'Enregistrer'} submitIcon="💾">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Libellé *</label>
          <input required value={form.libelle} onChange={setF('libelle')}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F) *</label>
            <input required type="number" min="0" value={form.montant} onChange={setF('montant')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date *</label>
            <input required type="date" value={form.date} onChange={setF('date')}
              className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Catégorie</label>
            <select value={form.categorie} onChange={setF('categorie')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mode de paiement</label>
            <select value={form.modePaiement} onChange={setF('modePaiement')}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none">
              <option value="cash">💵 Cash</option>
              <option value="mobile_money">📱 Mobile Money</option>
              <option value="cheque">🏦 Chèque</option>
              <option value="virement">💸 Virement</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={setF('notes')} rows={2}
            className="w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none resize-none" />
        </div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la dépense" message={`Supprimer « ${confirmDelete?.libelle} » ? Cette action est irréversible.`} />
    </div>
  );
}
