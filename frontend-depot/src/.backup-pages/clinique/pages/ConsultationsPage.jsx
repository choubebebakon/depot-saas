import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import ConsultationForm from '../forms/ConsultationForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'consultations');
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/clinique/consultations'); setConsultations(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await api.patch(`/clinique/consultations/${confirmDelete.id}`, { actif: false }); showNotif('Consultation supprimée ✓'); setConfirmDelete(null); load(); }
    catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const filtres = consultations.filter(c => { const q = search.toLowerCase(); return !q || c.patientNom?.toLowerCase().includes(q) || c.medecinNom?.toLowerCase().includes(q) || c.motif?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-sky-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">🩺 Consultations</h1><p className="text-slate-400 text-sm mt-1">{consultations.length} consultation{consultations.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20">+ Nouvelle Consultation</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Patient, médecin..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Patient</th><th className="text-left px-5 py-4">Médecin</th><th className="text-left px-5 py-4">Motif</th><th className="text-right px-5 py-4">Coût</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune consultation trouvée</td></tr>
              : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 font-black text-sm">{c.patientNom?.[0]?.toUpperCase()}</div><span className="text-white font-semibold text-sm">{c.patientNom}</span></div></td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.medecinNom || '—'}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm max-w-[200px] truncate">{c.motif}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(c.cout || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} consultation{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <ConsultationForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Consultation modifiée ✓' : 'Consultation créée ✓'); load(); }} edit={editItem} />}
      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer la consultation"
          message={`Êtes-vous sûr de vouloir supprimer la consultation de "${confirmDelete.patientNom}" ?`}
        />
      )}
    </div>
  );
}
