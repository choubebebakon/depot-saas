import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import FormModal from '../../../shared/components/forms/FormModal';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const MOTIFS_RETOUR = ['Erreur client', 'Périmé', 'Non conforme', 'Effet indésirable', 'Autre'];

export default function RetoursPage() {
  const [retours, setRetours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMotif, setFormMotif] = useState(MOTIFS_RETOUR[0]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmValidate, setConfirmValidate] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'retours');
  const itemsPerPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/retours');
      setRetours(res.data?.data || res.data || []);
    } catch (_) { setRetours([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const filtres = retours.filter(r => {
    const q = search.toLowerCase();
    return !q || r.motif?.toLowerCase().includes(q) || r.medicamentNom?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const handleNewRetour = async () => {
    if (!formMotif) return;
    try {
      await api.post('/pharmacie/retours', { motif: formMotif, montant: 0 });
      showNotif('Retour enregistré ✓');
      setFormOpen(false);
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
  };

  const handleValider = async () => {
    if (!confirmValidate) return;
    try {
      await api.patch(`/pharmacie/retours/${confirmValidate.id}`, { statut: 'valide' });
      showNotif('Retour validé ✓');
      setConfirmValidate(null);
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
  };

  const handleRembourser = async (id) => {
    try {
      await api.patch(`/pharmacie/retours/${id}`, { statut: 'rembourse' });
      showNotif('Remboursement effectué ✓');
      load();
    } catch (_) { showNotif('Erreur', 'error'); }
  };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🔄 Retours</h1>
          <p className="text-slate-400 text-sm mt-1">{retours.length} retour{retours.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setFormMotif(MOTIFS_RETOUR[0]); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouveau Retour
        </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Médicament</th>
                <th className="text-left px-5 py-4">Motif</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun retour enregistré</td></tr>
              ) : paginated.map(r => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold text-sm">{r.medicamentNom || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">{r.motif}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-5 py-4 text-center">
                    {r.statut === 'valide' ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Validé</span>
                    : r.statut === 'rembourse' ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Remboursé</span>
                    : <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">En attente</span>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {r.statut === 'en_attente' && (
                        <>
                          <button onClick={() => setConfirmValidate(r)}
                            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 text-sm transition-colors" title="Valider">✅</button>
                          <button onClick={() => handleRembourser(r.id)}
                            className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/10 text-sm transition-colors" title="Rembourser">💰</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} retour{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <FormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleNewRetour} title="🔄 Nouveau retour" submitLabel="Enregistrer" submitIcon="➕">
        <div>
          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Motif du retour *</label>
          <select value={formMotif} onChange={e => setFormMotif(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm outline-none">
            {MOTIFS_RETOUR.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </FormModal>

      {confirmValidate && (
        <ConfirmModal
          isOpen={!!confirmValidate}
          onConfirm={handleValider}
          onCancel={() => setConfirmValidate(null)}
          title="Valider le retour"
          message={`Valider le retour pour motif : "${confirmValidate.motif}" ?`}
          confirmLabel="Valider"
          danger={false}
        />
      )}
    </div>
  );
}
