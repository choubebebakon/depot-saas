import { useState, useEffect } from 'react'; import api from '../../../api';
import DevisForm from '../forms/DevisForm';
export default function DevisPage() {
  const [devis, setDevis] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [form, setForm] = useState({ client: '', produit: '', quantite: '', montant: '', statut: 'EN_ATTENTE' });
  const limit = 20;
  useEffect(() => {
    setLoading(true);
    api.get('/ciment-btp/devis', { params: { page, limit, search } }).then(r => { setDevis(r.data.data); setTotal(r.data.total); }).catch(() => { setDevis([]); }).finally(() => setLoading(false));
  }, [page, search]);
  const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/ciment-btp/devis', form); setShowModal(false); setForm({ client: '', produit: '', quantite: '', montant: '', statut: 'EN_ATTENTE' }); window.location.reload(); } catch { alert('Erreur'); } };
  const handleDelete = async (id) => { if (window.confirm('Supprimer ?')) { try { await api.delete(`/ciment-btp/devis/${id}`); window.location.reload(); } catch { alert('Erreur'); } } };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-black text-white tracking-tight">📋 Devis</h1><p className="text-slate-400 text-sm">{total} devis</p></div>
        <button onClick={() => { setForm({ client: '', produit: '', quantite: '', montant: '', statut: 'EN_ATTENTE' }); setShowModal(true); }} className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">+ Nouveau devis</button></div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50"><table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase"><tr><th className="p-4 text-left">Client</th><th className="p-4 text-left">Produit</th><th className="p-4 text-right">Qté</th><th className="p-4 text-right">Montant</th><th className="p-4 text-left">Statut</th><th className="p-4 text-left">Date</th><th className="p-4 text-center">Actions</th></tr></thead><tbody>{devis.map(d => (
          <tr key={d.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{d.client}</td><td className="p-4 text-slate-300">{d.produit}</td><td className="p-4 text-right text-white">{d.quantite}</td><td className="p-4 text-right text-white font-bold">{Number(d.montant).toLocaleString()} F</td><td className="p-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${d.statut === 'ACCEPTE' ? 'bg-green-500/20 text-green-400' : d.statut === 'REFUSE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{d.statut}</span></td><td className="p-4 text-slate-300">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><button onClick={() => handleDelete(d.id)} className="text-red-400 text-xs">🗑️</button></td></tr>
        ))}</tbody></table></div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}
      <DevisForm isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => { window.location.reload(); }} metier="ciment-btp" />
    </div>
  );
}
