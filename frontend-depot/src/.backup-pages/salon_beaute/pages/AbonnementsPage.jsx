import { useState, useEffect } from 'react'; import api from '../../../api';
export default function AbonnementsPage() {
  const [abonnements, setAbonnements] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ clientNom: '', type: 'FORFAIT_5', montant: '', validite: '30', dateDebut: '', notes: '' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/salon/abonnements', { params: { page, limit, search } }).then(r => { setAbonnements(r.data.data); setTotal(r.data.total); }).catch(() => { setAbonnements([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { if (edit) { await api.put(`/salon/abonnements/${edit.id}`, form); } else { await api.post('/salon/abonnements', form); } setShowModal(false); setEdit(null); setForm({ clientNom: '', type: 'FORFAIT_5', montant: '', validite: '30', dateDebut: '', notes: '' }); window.location.reload(); } catch { alert('Erreur'); } };
  const openEdit = (a) => { setEdit(a); setForm(a); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/salon/abonnements/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">🎁 Fidélité / Abonnements</h1><p className="text-slate-400 text-sm">{total} abonnement(s)</p></div>
        <button onClick={() => { setEdit(null); setForm({ clientNom: '', type: 'FORFAIT_5', montant: '', validite: '30', dateDebut: '', notes: '' }); setShowModal(true); }} className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvel abonnement</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher client..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Type</th><th className="text-right p-4">Montant</th><th className="text-right p-4">Validité</th><th className="text-left p-4">Début</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{abonnements.map(a => (
            <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{a.clientNom}</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-pink-500/20 text-pink-400">{a.type}</span></td><td className="p-4 text-right text-white font-bold">{Number(a.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4 text-right text-slate-300">{a.validite} jours</td><td className="p-4 text-slate-300">{a.dateDebut ? new Date(a.dateDebut).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => openEdit(a)} className="text-pink-400 hover:text-pink-300 text-xs font-bold">✏️</button><button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></div></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">{edit ? 'Modifier' : 'Nouvel'} abonnement</h2><form onSubmit={handleSubmit} className="space-y-4">
      {['clientNom','montant','validite','dateDebut','notes'].map(f => (
        <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'montant' || f === 'validite' ? 'number' : f === 'dateDebut' ? 'date' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'clientNom' || f === 'montant'} /></div>
      ))}
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="FORFAIT_5">Forfait 5 séances</option><option value="FORFAIT_10">Forfait 10 séances</option><option value="MENSUEL">Mensuel illimité</option><option value="ANNUEL">Annuel</option></select></div>
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1 transition-all">{edit ? 'Enregistrer' : 'Créer'}</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm transition-all">Annuler</button></div></form></div></div>}
    </div>
  );
}
