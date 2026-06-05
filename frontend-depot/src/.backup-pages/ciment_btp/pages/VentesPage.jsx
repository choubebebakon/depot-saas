import { useState, useEffect } from 'react'; import api from '../../../api';
export default function VentesPage() {
  const [ventes, setVentes] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [form, setForm] = useState({ client: '', produit: '', quantite: '1', montant: '', modePaiement: 'ESPECES' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/ventes', { params: { page, limit, search } }).then(r => { setVentes(r.data.data); setTotal(r.data.total); }).catch(() => { setVentes([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/ciment-btp/ventes', form); setShowModal(false); setForm({ client: '', produit: '', quantite: '1', montant: '', modePaiement: 'ESPECES' }); window.location.reload(); } catch { alert('Erreur'); } };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/ventes/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">💰 Ventes</h1><p className="text-slate-400 text-sm">{total} vente(s)</p></div>
        <button onClick={() => { setForm({ client: '', produit: '', quantite: '1', montant: '', modePaiement: 'ESPECES' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouvelle vente</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Client</th><th className="p-4 text-left">Produit</th><th className="p-4 text-right">Qté</th><th className="p-4 text-right">Montant</th><th className="p-4 text-left">Paiement</th><th className="p-4 text-left">Date</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{ventes.map(v => (
          <tr key={v.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{v.client}</td><td className="p-4 text-slate-300">{v.produit}</td><td className="p-4 text-right text-white">{v.quantite}</td><td className="p-4 text-right text-white font-bold">{Number(v.montant).toLocaleString()} F</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{v.modePaiement}</span></td><td className="p-4 text-slate-300">{v.createdAt ? new Date(v.createdAt).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><button onClick={() => handleDelete(v.id)} className="text-red-400 text-xs">🗑️</button></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}><div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}><h2 className="text-white font-black text-xl mb-6">Nouvelle vente</h2><form onSubmit={handleSubmit} className="space-y-4">{['client','produit','quantite','montant'].map(f => (<div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f}</label><input type={f === 'quantite' || f === 'montant' ? 'number' : 'text'} value={form[f]} onChange={e => setForm({...form, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'montant'} /></div>))}
      <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Mode</label><select value={form.modePaiement} onChange={e => setForm({...form, modePaiement: e.target.value })} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="ESPECES">Espèces</option><option value="CARTE">Carte</option><option value="MOBILE">Mobile money</option></select></div>
      <div className="flex gap-3 pt-4"><button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex-1">Créer</button><button type="button" onClick={() => setShowModal(false)} className="bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm">Annuler</button></div></form></div></div>}
    </div>
  );
}
