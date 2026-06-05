import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const LIMIT = 20;
export default function VentesPage() {
  const [ventes, setVentes] = useState([]); const [loading, setLoading] = useState(true); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(''); const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ clientNom: '', service: '', montant: '', modePaiement: 'ESPECES', notes: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => { setLoading(true);
    try { const r = await api.get('/pressing/ventes', { params: { page, limit: LIMIT, search } }); setVentes(r.data.data); setTotal(r.data.total); }
    catch { setVentes([]); } finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { load(); }, [load]);
  const openCreate = () => { setForm({ clientNom: '', service: '', montant: '', modePaiement: 'ESPECES', notes: '' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true);
    try { await api.post('/pressing/ventes', form); setFormOpen(false); load(); }
    catch { alert('Erreur'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/pressing/ventes/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur'); } finally { setDeleting(false); }
  };
  const totalPages = Math.ceil(total / LIMIT);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">💰 Ventes</h1><p className="text-slate-400 text-sm">{total} vente(s)</p></div>
        <button onClick={openCreate} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">+ Nouvelle vente</button>
      </div>
      <div className="flex gap-4"><input type="text" placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 w-full max-w-md text-sm" /></div>
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
          <table className="w-full text-sm"><thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><tr><th className="text-left p-4">Client</th><th className="text-left p-4">Service</th><th className="text-right p-4">Montant</th><th className="text-left p-4">Paiement</th><th className="text-left p-4">Date</th><th className="text-center p-4">Actions</th></tr></thead><tbody>{ventes.map(v => (
            <tr key={v.id} className="border-t border-slate-800 hover:bg-slate-800/40"><td className="p-4 text-white font-semibold">{v.clientNom || 'Comptant'}</td><td className="p-4 text-slate-300">{v.service || '-'}</td><td className="p-4 text-right text-white font-bold">{Number(v.montant || 0).toLocaleString('fr-FR')} F</td><td className="p-4"><span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-300">{v.modePaiement}</span></td><td className="p-4 text-slate-300">{v.createdAt ? new Date(v.createdAt).toLocaleDateString('fr-FR') : '-'}</td><td className="p-4 text-center"><button onClick={() => setConfirmDelete(v)} className="text-red-400 hover:text-red-300 text-xs font-bold">🗑️</button></td></tr>
          ))}</tbody></table>
        </div>
      )}
      {totalPages > 1 && <div className="flex justify-center items-center gap-2 text-sm"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">◀</button><span className="text-slate-400 px-4">{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white">▶</button></div>}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title="💰 Nouvelle vente" loading={saving} submitLabel="Créer">
        {['clientNom','service','montant','notes'].map(f => (
          <div key={f}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f === 'clientNom' ? 'Client' : f === 'service' ? 'Service' : f === 'montant' ? 'Montant (FCFA)' : 'Notes'}</label><input type={f === 'montant' ? 'number' : 'text'} value={form[f]} onChange={set(f)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" required={f === 'montant'} /></div>
        ))}
        <div><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">Mode de paiement</label><select value={form.modePaiement} onChange={set('modePaiement')} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm"><option value="ESPECES">Espèces</option><option value="CARTE">Carte</option><option value="MOBILE">Mobile money</option><option value="CHEQUE">Chèque</option></select></div>
      </FormModal>

      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la vente" message={`Supprimer la vente de ${confirmDelete?.clientNom || 'comptant'} (${Number(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F) ?`} />
    </div>
  );
}
