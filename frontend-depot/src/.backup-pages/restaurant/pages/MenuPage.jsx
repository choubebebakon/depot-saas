import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import PlatForm from '../forms/PlatForm';
import MenuJourForm from '../forms/MenuJourForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const CATEGORIES = ['Entrée', 'Plat principal', 'Dessert', 'Boisson', 'Apéritif', 'Accompagnement'];

export default function MenuPage() {
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [menuJourOpen, setMenuJourOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/restaurant/menu'); setPlats(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/restaurant/menu/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const filtres = plats.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.categorie?.toLowerCase().includes(q);
    const matchCat = !filtreCategorie || p.categorie === filtreCategorie;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">📖 Menu</h1><p className="text-slate-400 text-sm mt-1">{plats.length} plat{plats.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">+ Nouveau Plat</button>
        <button onClick={() => setMenuJourOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">📋 Menu du jour</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-red-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreCategorie} onChange={e => { setFiltreCategorie(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Toutes catégories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-500">Aucun plat trouvé</div>
          ) : paginated.map(p => (
            <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-red-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 font-black text-base">{p.nom?.[0]?.toUpperCase()}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{p.nom}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{p.categorie}</p>
                  </div>
                </div>
                <p className="text-white font-black text-sm">{(p.prix || 0).toLocaleString('fr-FR')} F</p>
              </div>
              {p.description && <p className="text-slate-400 text-xs mb-2 line-clamp-2">{p.description}</p>}
              {p.ingredients && <p className="text-slate-500 text-[10px]">🥕 {p.ingredients}</p>}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-end gap-2">
                <button onClick={() => { setEditItem(p); setFormOpen(true); }} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button>
                <button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 mt-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-xs">{filtres.length} plat{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
            <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
          </div>
        </div>
      )}
      <PlatForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="restaurant" />
      <MenuJourForm isOpen={menuJourOpen} onClose={() => setMenuJourOpen(false)} onSuccess={() => load()} metier="restaurant" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le plat" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
