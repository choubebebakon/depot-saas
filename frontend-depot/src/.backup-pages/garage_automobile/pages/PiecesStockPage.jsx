import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import PieceGarageForm from '../forms/PieceGarageForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const CATEGORIES = ['Moteur', 'Freinage', 'Suspension', 'Électricité', 'Carrosserie', 'Filtres', 'Lubrifiant', 'Pneumatique', 'Accessoire'];
export default function PiecesStockPage() {
  const [pieces, setPieces] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreCat, setFiltreCat] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'pieces'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/pieces'); setPieces(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (p) => { setEditItem(p); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/pieces/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Pièce supprimée ✓'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const filtres = pieces.filter(p => { const q = search.toLowerCase(); const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q); const matchC = !filtreCat || p.categorie === filtreCat; return matchSearch && matchC; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const estAlerte = (p) => p.seuilAlerte && p.quantite <= p.seuilAlerte;
  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">⚙️ Stock Pièces</h1><p className="text-slate-400 text-sm mt-1">{pieces.length} pièce{pieces.length !== 1 ? 's' : ''}{pieces.filter(estAlerte).length > 0 && <span className="text-red-400 ml-2">⚠️ {pieces.filter(estAlerte).length} alerte{pieces.filter(estAlerte).length > 1 ? 's' : ''}</span>}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouvelle Pièce</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Nom ou référence..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreCat} onChange={e => { setFiltreCat(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes catégories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Pièce</th><th className="text-left px-5 py-4">Catégorie</th><th className="text-right px-5 py-4">Qté</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune pièce trouvée</td></tr>
              : paginated.map(p => (
                <tr key={p.id} className={`hover:bg-slate-700/20 transition-colors ${estAlerte(p) ? 'bg-red-500/5' : ''}`}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 font-black text-sm">⚙️</div><div><p className="text-white font-semibold text-sm">{p.nom}</p>{p.reference && <p className="text-slate-500 text-xs">{p.reference}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">{p.categorie}</span></td>
                  <td className="px-5 py-4 text-right"><span className={`font-mono font-bold ${estAlerte(p) ? 'text-red-400' : 'text-white'}`}>{p.quantite || 0}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(p.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}
                      {perm.canDelete && <button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} pièce{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <PieceGarageForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Pièce modifiée ✓' : 'Pièce créée ✓'); load(); }} edit={editItem} metier="garage" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la pièce" message={`Supprimer « ${confirmDelete?.nom || confirmDelete?.designation} » ? Cette action est irréversible.`} />
    </div>
  );
}
