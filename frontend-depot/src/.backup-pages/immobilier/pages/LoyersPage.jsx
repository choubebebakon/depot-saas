import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import PaiementLoyerForm from '../forms/PaiementLoyerForm';

export default function LoyersPage() {
  const [loyers, setLoyers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ contratId: '', mois: '', montant: '', datePaiement: '', statut: 'PAYE' }); const [formLoading, setFormLoading] = useState(false); const [formError, setFormError] = useState('');
  const [contrats, setContrats] = useState([]);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'loyers'); const itemsPerPage = 20;
  const [paiementFormOpen, setPaiementFormOpen] = useState(false); const [paiementContrat, setPaiementContrat] = useState(null);
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/immobilier/loyers'); setLoyers(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (formOpen) api.get('/immobilier/contrats').then(r => setContrats(r.data?.data || r.data || [])).catch(() => {}); }, [formOpen]);
  const openCreate = () => { setEditItem(null); setFormData({ contratId: '', mois: '', montant: '', datePaiement: '', statut: 'PAYE' }); setFormError(''); setFormOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormData({ contratId: item.contratId || '', mois: item.mois || '', montant: item.montant || '', datePaiement: item.datePaiement?.split('T')[0] || '', statut: item.statut || 'PAYE' }); setFormError(''); setFormOpen(true); };
  const handleFormSubmit = async (e) => { e.preventDefault(); setFormLoading(true); try { if (editItem) await api.patch(`/immobilier/loyers/${editItem.id}`, formData); else await api.post('/immobilier/loyers', formData); setFormOpen(false); load(); } catch (err) { setFormError(err.response?.data?.message || 'Erreur'); } finally { setFormLoading(false); } };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/immobilier/loyers/${confirmDelete.id}`); setConfirmDelete(null); load(); } catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); } };
  const set = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });
  const filtres = loyers.filter(l => { const q = search.toLowerCase(); return !q || l.contrat?.bien?.nom?.toLowerCase().includes(q) || l.contrat?.locataire?.nom?.toLowerCase().includes(q) || l.mois?.includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage); const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const inputClass = 'w-full bg-slate-800 border border-slate-600 focus:border-teal-500 text-white rounded-xl px-4 py-3 text-sm outline-none';
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">💰 Loyers</h1><p className="text-slate-400 text-sm mt-1">{loyers.length} loyer{loyers.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-teal-600/20">+ Nouveau Loyer</button>}
        {perm.canCreate && <button onClick={() => { if (contrats.length > 0) { setPaiementContrat(contrats[0]); setPaiementFormOpen(true); } else { api.get('/immobilier/contrats').then(r => { const cs = r.data?.data || r.data || []; if (cs.length > 0) { setPaiementContrat(cs[0]); setPaiementFormOpen(true); } }); } }} className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-amber-500/20 ml-2">💰 Nouveau Paiement</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Bien, locataire ou mois..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-teal-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Bien</th><th className="text-left px-5 py-4">Locataire</th><th className="text-left px-5 py-4">Mois</th><th className="text-right px-5 py-4">Montant</th><th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun loyer trouvé</td></tr>
              : paginated.map(l => (
                <tr key={l.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{l.contrat?.bien?.nom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300">{l.contrat?.locataire?.nom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{l.mois || '—'}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(l.montant || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${l.statut === 'PAYE' ? 'bg-green-500/20 text-green-400' : l.statut === 'RETARD' ? 'bg-red-500/20 text-red-400' : l.statut === 'EN_ATTENTE' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>{l.statut}</span></td>
                  <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1">{perm.canEdit && <button onClick={() => openEdit(l)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>}{perm.canDelete && <button onClick={() => setConfirmDelete(l)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm">🗑️</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} loyer{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${page === p ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} title={editItem ? '✏️ Modifier loyer' : '💰 Nouveau loyer'} loading={formLoading}>
        {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{formError}</div>}
        <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Contrat *</label><select required value={formData.contratId} onChange={set('contratId')} className={inputClass}><option value="">Sélectionner un contrat</option>{contrats.map(c => <option key={c.id} value={c.id}>{c.bien?.nom} — {c.locataire?.nom}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Mois</label><input type="month" value={formData.mois} onChange={set('mois')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant (F CFA)</label><input type="number" value={formData.montant} onChange={set('montant')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Date paiement</label><input type="date" value={formData.datePaiement} onChange={set('datePaiement')} className={inputClass} /></div>
          <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Statut</label><select value={formData.statut} onChange={set('statut')} className={inputClass}><option value="PAYE">Payé</option><option value="EN_ATTENTE">En attente</option><option value="RETARD">En retard</option><option value="IMPAGE">Impayé</option></select></div>
        </div>
      </FormModal>
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} title="Supprimer le loyer" message={`Supprimer ce paiement de ${(confirmDelete?.montant || 0).toLocaleString('fr-FR')} F ? Cette action est irréversible.`} />
      <PaiementLoyerForm isOpen={paiementFormOpen} onClose={() => setPaiementFormOpen(false)} onSuccess={() => { load(); }} metier="immobilier" contrat={paiementContrat} />
    </div>
  );
}
