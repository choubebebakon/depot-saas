import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import ClientForm from '../../../shared/forms/ClientForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'patients');
  const itemsPerPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/pharmacie/patients'); setPatients(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.patch(`/pharmacie/patients/${confirmDelete.id}`, { actif: false });
      showNotif('Patient supprimé ✓');
      setConfirmDelete(null);
      load();
    } catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const filtres = patients.filter(p => {
    const q = search.toLowerCase();
    return !q || p.nom?.toLowerCase().includes(q) || p.telephone?.includes(q) || p.email?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">👥 Patients</h1>
          <p className="text-slate-400 text-sm mt-1">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouveau Patient
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher un patient..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20"><span className="text-6xl">👥</span><p className="text-slate-400 font-semibold mt-4">Aucun patient trouvé</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(p => (
            <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 rounded-2xl p-5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-black text-lg">
                    {p.nom?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-bold">{p.nom}</p>
                    {p.groupeSanguin && <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{p.groupeSanguin}</span>}
                  </div>
                </div>
                {perm.canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {perm.canEdit && (
                  <button onClick={() => { setEditItem(p); setFormOpen(true); }}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm">✏️</button>
                  )}
                  {perm.canDelete && (
                  <button onClick={() => setConfirmDelete(p)}
                    className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm">🗑️</button>
                  )}
                </div>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {p.telephone && <p>📞 {p.telephone}</p>}
                {p.email && <p>📧 {p.email}</p>}
                {p.allergies && <p className="text-red-400 font-semibold">⚠️ Allergie: {p.allergies}</p>}
                {p.traitementEnCours && <p className="text-amber-400">💊 Traitement: {p.traitementEnCours}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 mt-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          <span className="text-slate-400 text-xs">{filtres.length} patient{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
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

      {formOpen && <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Patient modifié ✓' : 'Patient créé ✓'); load(); }} edit={editItem} metier="pharmacie" />}

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le patient"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.nom}" ?`}
        />
      )}
    </div>
  );
}
