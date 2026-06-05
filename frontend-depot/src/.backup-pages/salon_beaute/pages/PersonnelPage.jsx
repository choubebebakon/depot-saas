import { useState, useEffect } from 'react'; import api from '../../../api';
export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ nom: '', role: 'COIFFEUR', telephone: '', email: '', specialite: '', salaire: '' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/salon/personnel', { params: { page, limit, search } }).then(r => { setPersonnel(r.data.data); setTotal(r.data.total); }).catch(() => { setPersonnel([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/salon/personnel/${edit.id}`, form); } else { await api.post('/salon/personnel', form); } setShowModal(false); setEdit(null); setForm({ nom: '', role: 'COIFFEUR', telephone: '', email: '', specialite: '', salaire: '' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (p) => { setEdit(p); setForm(p); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/salon/personnel/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">👥 Personnel</h1><p className="text-slate-400 text-sm">{total} employé(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ nom: '', role: 'COIFFEUR', telephone: '', email: '', specialite: '', salaire: '' }); setShowModal(true); }} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvel employé</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Nom</th><th className="text-left p-4">Rôle</th><th className="text-left p-4">Spécialité</th><th className="text-left p-4">Tél.</th><th className="text-right p-4">Salaire</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{personnel.map(p => (
            <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{p.nom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{p.role}</span></td><td className="p-4 text-slate-300">{p.specialite || '-'}</td><td className="p-4 text-slate-300">{p.telephone || '-'}</td><td className="p-4 text-right text-white font-bold">{Number(p.salaire || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(p)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvel'} employé</h2><form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Rôle</label><select value={form.role} onChange={e => setForm({...form, role: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="COIFFEUR">Coiffeur</option><option value="ESTHETICIEN">Esthéticien</option><option value="MANUCURE">Manucure</option><option value="RECEPTEUR">Récepteur</option><option value="GERANT">Gérant</option></select></div>
      {['nom','telephone','specialite','salaire'].map(f => (
        <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'salaire' ? 'number' : f === 'telephone' ? 'tel' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'nom'} /></div>
      ))}<div className="flex gap-3 pt-4"><button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1 transition-all">{edit ? 'Enregistrer' : 'Créer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm transition-all">Annuler</button></div></form></div></div>}
    </div>
  );
}
