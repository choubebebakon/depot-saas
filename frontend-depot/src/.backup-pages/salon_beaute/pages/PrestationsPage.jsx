import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import PrestationForm from '../forms/PrestationForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const CATEGORIES = { COIFFURE: '💇', SOIN: '🧴', MANUCURE: '💅', PEDI_CURE: '🦶', MAQUILLAGE: '💄', EPILATION: '🪒', AUTRE: '✨' };
const LIMIT = 20;

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/salon/prestations', { params: { page, limit: LIMIT, search } }); setPrestations(r.data.data); setTotal(r.data.total); }
    catch { setPrestations([]); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (p) => { setEditItem(p); setFormOpen(true); };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/salon/prestations/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">💇 Prestations</h1><p className="text-slate-400 text-sm">{total} prestation(s)</p></div>
        <button onClick={openCreate} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle prestation</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Nom</th><th className="text-left p-4">Catégorie</th><th className="text-center p-4">Durée</th><th className="text-right p-4">Prix (F)</th><th className="text-left p-4">Description</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{prestations.map(p => (
            <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{p.nom}</td><td className="p-4"><span className="text-lg">{CATEGORIES[p.categorie] || '✨'}</span><span className="text-slate-400 text-xs ml-1">{p.categorie}</span></td><td className="p-4 text-center text-slate-300">{p.dureeMin || p.duree} min</td><td className="p-4 text-right text-white font-bold">{Number(p.prix || 0).toLocaleString('fr-FR')}</td><td className="p-4 text-slate-300">{p.description || '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(p)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => setConfirmDelete(p)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <PrestationForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="salon" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la prestation" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
