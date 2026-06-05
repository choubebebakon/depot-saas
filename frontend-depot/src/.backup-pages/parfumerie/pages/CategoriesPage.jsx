import { useState, useEffect } from 'react'; import api from '../../../api';
import CategorieParfumerieForm from '../forms/CategorieParfumerieForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
export default function CategoriesPage() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [edit, setEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const load = () => { setLoading(true); api.get('/parfumerie/categories').then(r => { setData(r.data); }).catch(() => setData([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const handleDelete = async () => { if (!confirm) return; try { await api.delete(`/parfumerie/categories/${confirm.id}`); setConfirm(null); load(); } catch { alert('Erreur'); } };
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-black text-white tracking-tight">📁 Catégories</h1><p className="text-slate-400 text-sm">{data.length} catégorie(s)</p></div>
        <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle catégorie</button>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between"><h3 className="text-white font-bold">{c.nom}</h3><div className="flex gap-2"><button onClick={() => { setEdit(c); setShowForm(true); }} className="text-fuchsia-400 text-xs">✏️</button><button onClick={() => setConfirm(c)} className="text-red-400 text-xs">🗑️</button></div></div>
              {c.description && <p className="text-slate-400 text-sm mt-1">{c.description}</p>}
            </div>
          ))}
          {data.length === 0 && !loading && <div className="col-span-full text-center py-16 text-slate-500"><p className="text-lg font-semibold">Aucune catégorie</p></div>}
        </div>
      )}
      <CategorieParfumerieForm isOpen={showForm} onClose={() => { setShowForm(false); setEdit(null); }} onSuccess={load} edit={edit} />
      <ConfirmModal isOpen={!!confirm} onConfirm={handleDelete} onCancel={() => setConfirm(null)} title="Supprimer ?" message={`Supprimer ${confirm?.nom} ?`} />
    </div>
  );
}
