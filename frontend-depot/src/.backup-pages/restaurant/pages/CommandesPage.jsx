import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import PriseCommandeForm from '../forms/PriseCommandeForm';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

const STATUTS_COMMANDE = ['En attente', 'En préparation', 'Prêt', 'Servi', 'Payé', 'Annulé'];

export default function CommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ tableNumero: '', articles: '', montant: '', statut: 'En attente', notes: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editErreur, setEditErreur] = useState('');
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'commandes');
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/restaurant/commandes'); setCommandes(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/restaurant/commandes/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const openEdit = (c) => {
    setEditItem(c);
    setEditForm({ tableNumero: c.tableNumero || '', articles: c.articles || '', montant: c.montant || '', statut: c.statut || 'En attente', notes: c.notes || '' });
    setFormOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setEditLoading(true);
    try { await api.patch(`/restaurant/commandes/${editItem.id}`, editForm); setFormOpen(false); load(); }
    catch (err) { setEditErreur(err.response?.data?.message || 'Erreur'); } finally { setEditLoading(false); }
  };

  const filtres = commandes.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.tableNumero?.toLowerCase().includes(q) || c.articles?.toLowerCase().includes(q);
    const matchStatut = !filtreStatut || c.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  if (formOpen && !editItem) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-black text-white">📋 Nouvelle commande</h1></div>
          <button onClick={() => setFormOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">← Retour</button>
        </div>
        <PriseCommandeForm metier="restaurant" onSuccess={() => { setFormOpen(false); load(); }} />
      </div>
    );
  }

  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-red-500 text-white rounded-xl px-4 py-3 text-sm outline-none';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📋 Commandes</h1><p className="text-slate-400 text-sm mt-1">{commandes.length} commande{commandes.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">+ Nouvelle Commande</button>}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Table ou articles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-red-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous statuts</option>{STATUTS_COMMANDE.map(s => <option key={s} value={s}>{s}</option>)}</select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Table</th>
                <th className="text-left px-5 py-4">Articles</th>
                <th className="text-right px-5 py-4">Montant</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune commande trouvée</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-sm">{c.tableNumero}</div><span className="text-white font-semibold text-sm">Table {c.tableNumero}</span></div></td>
                  <td className="px-5 py-4 text-slate-300 text-sm max-w-[250px] truncate">{c.articles}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(c.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statut === 'Servi' || c.statut === 'Payé' ? 'bg-emerald-500/20 text-emerald-400' : c.statut === 'En préparation' ? 'bg-yellow-500/20 text-yellow-400' : c.statut === 'Annulé' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{c.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-2">{perm.canEdit && <button onClick={() => openEdit(c)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button>}<button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} commande{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && editItem && (
        <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleEditSubmit} title="✏️ Modifier commande" loading={editLoading} submitLabel="Modifier">
          {editErreur && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{editErreur}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Table *</label><input required value={editForm.tableNumero} onChange={e => setEditForm({...editForm, tableNumero: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F)</label><input type="number" value={editForm.montant} onChange={e => setEditForm({...editForm, montant: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={editForm.statut} onChange={e => setEditForm({...editForm, statut: e.target.value})} className={inputClass}>{STATUTS_COMMANDE.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Articles</label><textarea value={editForm.articles} onChange={e => setEditForm({...editForm, articles: e.target.value})} className={inputClass + ' h-20'} /></div>
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Notes</label><input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className={inputClass} /></div>
          </div>
        </FormModal>
      )}

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la commande" message={`Supprimer la commande table « ${confirmDelete?.tableNumero} » ? Cette action est irréversible.`} />
    </div>
  );
}
