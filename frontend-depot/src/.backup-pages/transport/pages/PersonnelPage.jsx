import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import PersonnelForm from '../forms/PersonnelForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function PersonnelPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/transport/personnel', { params: { page, limit, search } })
      .then(r => { setData(r.data.data); setTotal(r.data.total); })
      .catch(() => { setData([]); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const openEdit = (item) => { setEditItem(item); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/transport/personnel/${confirmDelete.id}`);
      setConfirmDelete(null);
      load();
    } catch {
      alert('Erreur');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">👥 Personnel</h1>
          <p className="text-slate-400 text-sm">{total} employé(s)</p>
        </div>
        <button onClick={openCreate} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvel employé</button>
      </div>
      <div className="flex gap-4">
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" />
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Nom</th>
                <th className="p-4 text-left">Poste</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Téléphone</th>
                <th className="p-4 text-right">Salaire</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                  <td className="p-4 text-white font-semibold">{p.nom}</td>
                  <td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{p.poste}</span></td>
                  <td className="p-4 text-slate-300">{p.email}</td>
                  <td className="p-4 text-white">{p.telephone}</td>
                  <td className="p-4 text-right text-white font-bold">{Number(p.salaire).toLocaleString()} F</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-orange-400 text-xs">✏️</button>
                      <button onClick={() => setConfirmDelete(p)} className="text-red-400 text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button>
          <span className="text-slate-400 px-4">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button>
        </div>
      )}
      <PersonnelForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} message="Supprimer cet employé ?" loading={deleting} />
    </div>
  );
}
