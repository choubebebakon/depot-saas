import { useState, useEffect } from 'react'; import api from '../../../api';
export default function LivraisonsPage() {
  const [livraisons, setLivraisons] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [form, setForm] = useState({ client: '', produit: '', quantite: '', vehicule: '', chauffeur: '', statut: 'EN_ATTENTE' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/livraisons', { params: { page, limit, search } }).then(r => { setLivraisons(r.data.data); setTotal(r.data.total); }).catch(() => { setLivraisons([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/ciment-btp/livraisons', form); setShowModal(false); setForm({ client: '', produit: '', quantite: '', vehicule: '', chauffeur: '', statut: 'EN_ATTENTE' }); window.location.reload(); } catch { alert('Erreur'); } };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/livraisons/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">🚚 Livraisons</h1><p className="text-slate-400 text-sm">{total} livraison(s)</p></div>
        <button onClick={() => { setForm({ client: '', produit: '', quantite: '', vehicule: '', chauffeur: '', statut: 'EN_ATTENTE' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle livraison</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Client</th><th className="p-4 text-left">Produit</th><th className="p-4 text-right">Qté</th><th className="p-4 text-left">Véhicule</th><th className="p-4 text-left">Chauffeur</th><th className="p-4 text-left">Statut</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{livraisons.map(l => (
          <tr key={l.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{l.client}</td><td className="p-4 text-slate-300">{l.produit}</td><td className="p-4 text-right text-white">{l.quantite}</td><td className="p-4 text-slate-300">{l.vehicule}</td><td className="p-4 text-white">{l.chauffeur}</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${l.statut === 'LIVREE' ? 'bg-green-500/20 text-green-400' : l.statut === 'EN_COURS' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{l.statut}</span></td><td className="p-4 text-center"><button onClick={() => handleDelete(l.id)} className="text-red-400 text-xs">🗑️</button></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">Nouvelle livraison</h2><form onSubmit={handleSubmit} className="space-y-4">
      {['client','produit','quantite','vehicule','chauffeur'].map(f => (<div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'quantite' ? 'number' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'client' || f === 'produit'} /></div>))}
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Statut</label><select value={form.statut} onChange={e => setForm({...form, statut: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="EN_ATTENTE">En attente</option><option value="EN_COURS">En cours</option><option value="LIVREE">Livrée</option></select></div>
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1">Créer</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm">Annuler</button></div></form></div></div>}
    </div>
  );
}
