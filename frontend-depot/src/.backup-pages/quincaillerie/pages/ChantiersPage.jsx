import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission'; import FormModal from '../../../shared/components/forms/FormModal'; import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
const STATUTS_CHANTIER = ['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE'];
const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
export default function ChantiersPage() {
  const [chantiers, setChantiers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreStatut, setFiltreStatut] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false); const [notif, setNotif] = useState(null);
  const [form, setForm] = useState({ nom: '', clientId: '', description: '', adresse: '', dateDebut: '', dateFin: '', budget: '', statut: 'EN_ATTENTE' });
  const [clients, setClients] = useState([]); const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'chantiers'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/quincaillerie/chantiers'); setChantiers(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/quincaillerie/clients').then(res => setClients(res.data?.data || res.data || [])).catch(() => {}); }, []);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setForm({ nom: '', clientId: '', description: '', adresse: '', dateDebut: '', dateFin: '', budget: '', statut: 'EN_ATTENTE' }); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ nom: c.nom || '', clientId: c.clientId || '', description: c.description || '', adresse: c.adresse || '', dateDebut: c.dateDebut || '', dateFin: c.dateFin || '', budget: c.budget || '', statut: c.statut || 'EN_ATTENTE' }); setFormOpen(true); };
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { if (editItem) await api.patch(`/quincaillerie/chantiers/${editItem.id}`, form); else await api.post('/quincaillerie/chantiers', form); setFormOpen(false); showNotif(editItem ? 'Chantier modifié ✓' : 'Chantier créé ✓'); load(); } catch (err) { showNotif(err.response?.data?.message || 'Erreur', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/quincaillerie/chantiers/${confirmDelete.id}`); showNotif('Chantier supprimé ✓'); setConfirmDelete(null); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const setF = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const filtres = chantiers.filter(c => { const q = search.toLowerCase(); const matchSearch = !q || c.nom?.toLowerCase().includes(q); const matchS = !filtreStatut || c.statut === filtreStatut; return matchSearch && matchS; });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-amber-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🏗️ Chantiers</h1><p className="text-slate-400 text-sm mt-1">{chantiers.length} chantier{chantiers.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20">+ Nouveau Chantier</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Nom..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous statuts</option>{STATUTS_CHANTIER.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Chantier</th><th className="text-left px-5 py-4">Client</th><th className="text-center px-5 py-4">Statut</th><th className="text-right px-5 py-4">Budget</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun chantier trouvé</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{c.nom}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.client?.nom || '—'}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.statut === 'TERMINE' ? 'bg-emerald-500/20 text-emerald-400' : c.statut === 'EN_COURS' ? 'bg-blue-500/20 text-blue-400' : c.statut === 'ANNULE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.statut?.replace(/_/g, ' ')}</span></td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(c.budget || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <div className="flex items-center justify-center gap-1"><button onClick={() => openEdit(c)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>{perm.canDelete && <button onClick={() => setConfirmDelete(c)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors">🗑️</button>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} chantier{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} title={editItem ? '✏️ Modifier Chantier' : '🏗️ Nouveau Chantier'} loading={saving} submitLabel={editItem ? 'Modifier' : 'Créer'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label><input required value={form.nom} onChange={setF('nom')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Client</label><select value={form.clientId} onChange={setF('clientId')} className={inputClass}><option value="">Aucun</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={form.statut} onChange={setF('statut')} className={inputClass}>{STATUTS_CHANTIER.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date début</label><input type="date" value={form.dateDebut} onChange={setF('dateDebut')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date fin prévue</label><input type="date" value={form.dateFin} onChange={setF('dateFin')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Budget (F)</label><input type="number" value={form.budget} onChange={setF('budget')} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label><input value={form.adresse} onChange={setF('adresse')} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Description</label><textarea value={form.description} onChange={setF('description')} className={inputClass} rows={2} /></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le chantier" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
