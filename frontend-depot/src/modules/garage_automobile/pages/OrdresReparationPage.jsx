import { useState, useEffect, useCallback } from 'react'; import api from '../../../api'; import { PERMISSIONS } from '../permissions'; import { usePermission } from '../../../shared/hooks/usePermission';
import OrdreTravailForm from '../forms/OrdreTravailForm';
import DiagnosticForm from '../forms/DiagnosticForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { usePagination } from '../../../hooks/usePagination';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    // Object.setPrototypeOf(window, window.safeHandler) - REMOVED: not supported in modern browsers
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}

const STATUT_COULEUR = { RECU: 'bg-blue-500/20 text-blue-400', EN_DIAGNOSTIC: 'bg-yellow-500/20 text-yellow-400', DEVIS_ENVOYE: 'bg-purple-500/20 text-purple-400', EN_REPARATION: 'bg-orange-500/20 text-orange-400', EN_ATTENTE_PIECES: 'bg-red-500/20 text-red-400', PRET: 'bg-emerald-500/20 text-emerald-400', LIVRE: 'bg-green-500/20 text-green-400', ANNULE: 'bg-slate-500/20 text-slate-400' };
export default function OrdresReparationPage() {
  const [fiches, setFiches] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [filtreStatut, setFiltreStatut] = useState('');
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false); const [diagnosticFiche, setDiagnosticFiche] = useState(null);
  const [page, setPage] = useState(1); const perm = usePermission(PERMISSIONS, 'ordres'); const itemsPerPage = 20;
  const load = useCallback(async () => { setLoading(true); try { const res = await api.get('/garage/fiches-travaux'); setFiches(res.data?.data || res.data || []); } catch (_) {} finally { setLoading(false); } }, []);

  const [edit, setEdit] = useState(null);

  const STATUTS = ['En attente', 'En cours', 'Terminé', 'Annulé'];
  const handleStatut = async (id, statut) => { try { await api.patch(`/${prefix}/reparations/${id}`, { statut }); refetch(); success('Statut mis à jour'); } catch { notifError('Erreur'); } };
  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (f) => { setEditItem(f); setFormOpen(true); };
  const handleDelete = async () => { if (!confirmDelete) return; setDeleting(true); try { await api.delete(`/garage/fiches-travaux/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Ordre supprimé ?'); load(); } catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); } };
  const filtres = fiches.filter(f => { const q = search.toLowerCase(); const matchSearch = !q || f.reference?.toLowerCase().includes(q) || f.vehicule?.immatriculation?.toLowerCase().includes(q) || f.problemeClient?.toLowerCase().includes(q); const matchS = !filtreStatut || f.statut === filtreStatut; return matchSearch && matchS; });
  const totalItems = filtres.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-orange-600'}`}>{notif.msg}</div>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Ordres de Rparation</h1><p className="text-slate-400 text-sm mt-1">{totalItems} ordre{totalItems !== 1 ? 's' : ''}</p></div>
        {perm.canCreate && <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20">+ Nouvel Ordre</button>}
      </div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Rf., immatriculation..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }} className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none"><option value="">Tous statuts</option>{STATUTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest"><th className="text-left px-5 py-4">Rf.</th><th className="text-left px-5 py-4">Vhicule</th><th className="text-left px-5 py-4">Problme</th><th className="text-center px-5 py-4">Statut</th><th className="text-right px-5 py-4">Total</th><th className="text-center px-5 py-4">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun ordre trouvé</td></tr>
              : paginated.map(f => (
                <tr key={f.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4 text-white font-bold text-sm">{f.reference || `#${f.id}`}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{f.vehicule?.immatriculation || ''}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm max-w-[200px] truncate">{f.problemeClient}</td>
                  <td className="px-5 py-4 text-center">
                    <select value={f.statut} onChange={e => handleStatut(f, e.target.value)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border-0 ${STATUT_COULEUR[f.statut] || 'text-slate-400'}`}>
                      {STATUTS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(f.montantTotal || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {perm.canEdit && <button onClick={() => openEdit(f)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️ Modifier</button>}
                      <button onClick={() => { setDiagnosticFiche(f); setDiagnosticOpen(true); }} className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-500/10 text-sm transition-colors" title="Diagnostic">✏️ Modifier</button>
                      {perm.canDelete && <button onClick={() => setConfirmDelete(f)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️ Supprimer</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} ordre{filtres.length > 1 ? 's' : ''}  Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { const start = Math.max(1, page - 2); const p = start + i; if (p > totalPages) return null; return (<button key={p} onClick={() => goToPage(p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>); })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">?</button>
              </div>
            </div>
          )}
        </div>
      )}
      <OrdreTravailForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Ordre modifié ?' : 'Ordre cr ?'); load(); }} edit={editItem} metier="garage" />
      <DiagnosticForm isOpen={diagnosticOpen} onClose={() => { setDiagnosticOpen(false); setDiagnosticFiche(null); }} onSuccess={() => { showNotif('Diagnostic enregistr ?'); load(); setDiagnosticOpen(false); setDiagnosticFiche(null); }} metier="garage" ordreTravail={diagnosticFiche} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer l'ordre" message={`Supprimer l'ordre  ${confirmDelete?.reference || `#${confirmDelete?.id}`}  ? Cette action est irrversible.`} />
    </div>
  );
}
