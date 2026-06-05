import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import TelephoneForm from '../forms/TelephoneForm'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const MARQUES = ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Oppo', 'Tecno', 'Infinix', 'Nokia', 'Google', 'OnePlus'];
export default function TelephonesPage() {
  const [telephones, setTelephones] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreMarque, setFiltreMarque] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'telephones'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/telephonie/telephones'); setTelephones(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const handleDelete = async () => { if (!confirmDelete) return; try { await api.delete(`/telephonie/telephones/${confirmDelete.id}`); showNotif('Téléphone supprimé ✓'); setConfirmDelete(null); load(); } catch (_) { showNotif('Erreur lors de la suppression', 'error'); } };
  const filtres = telephones.filter(t => { const q = search.toLowerCase(); const matchSearch = !q || t.modele?.toLowerCase().includes(q) || t.marque?.toLowerCase().includes(q) || (t.imei || '').includes(q); const matchM = !filtreMarque || t.marque === filtreMarque; return matchSearch && matchM; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-purple-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📱 Téléphones</h1><p className="text-slate-400 text-sm mt-1">{telephones.length} modèle{telephones.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">+ Nouveau Téléphone</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Modèle, marque, IMEI..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-purple-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreMarque} onChange={e => { setFiltreMarque(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes marques</option>{MARQUES.map(m => <option key={m} value={m}>{m}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Modèle</th><th className="text-left px-5 py-4">Marque</th><th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Stock</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun téléphone trouvé</td></tr>
              : paginated.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">📱</div><div><p className="text-white font-semibold text-sm">{t.modele}</p>{t.imei && <p className="text-slate-500 text-xs">IMEI: {t.imei}</p>}</div></div></td>
                  <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{t.marque}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(t.prixVente || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><span className={`font-mono font-bold ${(t.stock || 0) <= 0 ? 'text-red-400' : 'text-white'}`}>{t.stock || 0}</span></td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => { setEditItem(t); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(t)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} modèle{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <TelephoneForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Téléphone modifié ✓' : 'Téléphone créé ✓'); load(); }} edit={editItem} />}
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} title="Supprimer le téléphone" message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.modele}" ?`} />
    </div>
  );
}
