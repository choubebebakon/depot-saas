import { useState, useEffect } from 'react'; import api from '../../../api';
import ChantierForm from '../forms/ChantierForm';
export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ nom: '', client: '', adresse: '', dateDebut: '', dateFin: '', statut: 'EN_COURS' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/chantiers', { params: { page, limit, search } }).then(r => { setChantiers(r.data.data); setTotal(r.data.total); }).catch(() => { setChantiers([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/ciment-btp/chantiers/${edit.id}`, form); } else { await api.post('/ciment-btp/chantiers', form); } setShowModal(false); setEdit(null); setForm({ nom: '', client: '', adresse: '', dateDebut: '', dateFin: '', statut: 'EN_COURS' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (c) => { setEdit(c); setForm(c); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/chantiers/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">🏗️ Chantiers</h1><p className="text-slate-400 text-sm">{total} chantier(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ nom: '', client: '', adresse: '', dateDebut: '', dateFin: '', statut: 'EN_COURS' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouveau chantier</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Nom</th><th className="p-4 text-left">Client</th><th className="p-4 text-left">Adresse</th><th className="p-4 text-left">Début</th><th className="p-4 text-left">Fin</th><th className="p-4 text-left">Statut</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{chantiers.map(c => (
          <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.nom}</td><td className="p-4 text-white">{c.client}</td><td className="p-4 text-slate-300">{c.adresse}</td><td className="p-4 text-slate-300">{c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-slate-300">{c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${c.statut === 'TERMINE' ? 'bg-green-500/20 text-green-400' : c.statut === 'EN_COURS' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.statut}</span></td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(c)} className="text-amber-500 text-xs">✏️</button><button onClick={() => handleDelete(c.id)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <ChantierForm isOpen={showModal} onClose={() => { setShowModal(false); setEdit(null); }} onSuccess={() => { window.location.reload(); }} edit={edit} metier="ciment-btp" />
    </div>
  );
}
