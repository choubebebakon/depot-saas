import { useState, useEffect } from 'react'; import api from '../../../api';
export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ nom: '', poste: 'OUVRIER', email: '', telephone: '', salaire: '' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/personnel', { params: { page, limit, search } }).then(r => { setPersonnel(r.data.data); setTotal(r.data.total); }).catch(() => { setPersonnel([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/ciment-btp/personnel/${edit.id}`, form); } else { await api.post('/ciment-btp/personnel', form); } setShowModal(false); setEdit(null); setForm({ nom: '', poste: 'OUVRIER', email: '', telephone: '', salaire: '' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (p) => { setEdit(p); setForm(p); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/personnel/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">👥 Personnel</h1><p className="text-slate-400 text-sm">{total} employé(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ nom: '', poste: 'OUVRIER', email: '', telephone: '', salaire: '' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvel employé</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Nom</th><th className="p-4 text-left">Poste</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Téléphone</th><th className="p-4 text-right">Salaire</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{personnel.map(p => (
          <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{p.nom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{p.poste}</span></td><td className="p-4 text-slate-300">{p.email}</td><td className="p-4 text-white">{p.telephone}</td><td className="p-4 text-right text-white font-bold">{Number(p.salaire).toLocaleString()} F</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(p)} className="text-amber-500 text-xs">✏️</button><button onClick={() => handleDelete(p.id)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvel'} employé</h2><form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Poste</label><select value={form.poste} onChange={e => setForm({...form, poste: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="OUVRIER">Ouvrier</option><option value="GERANT">Gérant</option><option value="CHEF_CHANTIER">Chef chantier</option><option value="CHAUFFEUR">Chauffeur</option><option value="COMMERCIAL">Commercial</option></select></div>
      {['nom','email','telephone','salaire'].map(f => (<div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'salaire' ? 'number' : f === 'email' ? 'email' : f === 'telephone' ? 'tel' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'nom'} /></div>))}
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1">{edit ? 'Enregistrer' : 'Créer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm">Annuler</button></div></form></div></div>}
    </div>
  );
}
