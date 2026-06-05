import { useState, useEffect } from 'react'; import api from '../../../api';
export default function ClientsPage() {
  const [clients, setClients] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '', type: 'PARTICULIER' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/clients', { params: { page, limit, search } }).then(r => { setClients(r.data.data); setTotal(r.data.total); }).catch(() => { setClients([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/ciment-btp/clients/${edit.id}`, form); } else { await api.post('/ciment-btp/clients', form); } setShowModal(false); setEdit(null); setForm({ nom: '', email: '', telephone: '', adresse: '', type: 'PARTICULIER' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (c) => { setEdit(c); setForm(c); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/clients/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">👤 Clients</h1><p className="text-slate-400 text-sm">{total} client(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ nom: '', email: '', telephone: '', adresse: '', type: 'PARTICULIER' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouveau client</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Nom</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Téléphone</th><th className="p-4 text-left">Type</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{clients.map(c => (
          <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{c.nom}</td><td className="p-4 text-slate-300">{c.email}</td><td className="p-4 text-white">{c.telephone}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{c.type}</span></td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(c)} className="text-amber-500 text-xs">✏️</button><button onClick={() => handleDelete(c.id)} className="text-red-400 text-xs">🗑️</button></div></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouveau'} client</h2><form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="PARTICULIER">Particulier</option><option value="ENTREPRISE">Entreprise</option><option value="PROMOTEUR">Promoteur</option></select></div>
      {['nom','email','telephone','adresse'].map(f => (<div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'email' ? 'email' : f === 'telephone' ? 'tel' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'nom' || f === 'telephone'} /></div>))}
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1">{edit ? 'Enregistrer' : 'Créer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm">Annuler</button></div></form></div></div>}
    </div>
  );
}
