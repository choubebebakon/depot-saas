import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import PatientForm from '../forms/PatientForm';
import DossierMedicalForm from '../forms/DossierMedicalForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dossierOpen, setDossierOpen] = useState(false); const [dossierPatient, setDossierPatient] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'patients');
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/clinique/patients'); setPatients(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await api.patch(`/clinique/patients/${confirmDelete.id}`, { actif: false }); showNotif('Patient supprimé ✓'); setConfirmDelete(null); load(); }
    catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const filtres = patients.filter(p => { const q = search.toLowerCase(); return !q || p.nom?.toLowerCase().includes(q) || p.telephone?.includes(q) || p.allergies?.toLowerCase().includes(q); });
  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-sky-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">👥 Patients</h1><p className="text-slate-400 text-sm mt-1">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20">+ Nouveau Patient</button>}
      </div>
      <div className="mb-6"><input type="text" placeholder="🔍 Nom, téléphone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-sky-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" /></div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Patient</th><th className="text-left px-5 py-4">Groupe</th><th className="text-right px-5 py-4">Téléphone</th><th className="text-left px-5 py-4">Allergies</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucun patient trouvé</td></tr>
              : paginated.map(p => (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 font-black text-sm">{p.nom?.[0]?.toUpperCase()}</div><div><p className="text-white font-semibold text-sm">{p.nom}</p>{p.mutuelle && <p className="text-slate-500 text-xs">{p.mutuelle}</p>}</div></div></td>
                  <td className="px-5 py-4 text-center"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{p.groupeSanguin || '—'}</span></td>
                  <td className="px-5 py-4 text-right text-slate-300 text-sm font-mono">{p.telephone || '—'}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs max-w-[200px] truncate">{p.allergies || '—'}</td>
                  <td className="px-5 py-4 text-center">{perm.canEdit && <button onClick={() => { setEditItem(p); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>}{perm.canEdit && <button onClick={() => { setDossierPatient(p); setDossierOpen(true); }} className="text-sky-400 hover:text-sky-300 p-1.5 rounded-lg hover:bg-sky-500/10 text-sm transition-colors ml-1" title="Dossier médical">📋</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} patient{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}
      {formOpen && <PatientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Patient modifié ✓' : 'Patient créé ✓'); load(); }} edit={editItem} />}
      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le patient"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.nom}" ?`}
        />
      )}
      <DossierMedicalForm isOpen={dossierOpen} onClose={() => setDossierOpen(false)} onSuccess={() => { showNotif('Dossier médical mis à jour ✓'); load(); }} metier="clinique" patient={dossierPatient} />
    </div>
  );
}
