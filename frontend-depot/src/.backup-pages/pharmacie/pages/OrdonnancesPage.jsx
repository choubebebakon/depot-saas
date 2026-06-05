import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import OrdonnanceForm from '../forms/OrdonnanceForm';
import DelivranceForm from '../forms/DelivranceForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const STATUTS = { EN_COURS: { label: 'En cours', color: 'blue' }, PARTIEL: { label: 'Partielle', color: 'amber' }, COMPLETE: { label: 'Complète', color: 'emerald' }, ANNULEE: { label: 'Annulée', color: 'red' } };

export default function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState([]);
  const [medicaments, setMedicaments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const [deliveryLigne, setDeliveryLigne] = useState(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryLignes, setDeliveryLignes] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const perm = usePermission(PERMISSIONS, 'ordonnances');
  const itemsPerPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, m, p] = await Promise.all([api.get('/pharmacie/ordonnances'), api.get('/pharmacie/medicaments'), api.get('/pharmacie/patients')]);
      setOrdonnances(o.data?.data || o.data || []);
      setMedicaments(m.data?.data || m.data || []);
      setPatients(p.data?.data || p.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.patch(`/pharmacie/ordonnances/${confirmDelete.id}`, { statut: 'ANNULEE' });
      showNotif('Ordonnance annulée ✓');
      setConfirmDelete(null);
      load();
    } catch (_) { showNotif('Erreur lors de l\'annulation', 'error'); }
  };

  const openDelivery = async (ordonnance) => {
    try {
      setDeliveryLoading(true);
      const r = await api.get(`/pharmacie/ordonnances/${ordonnance.id}/lignes`);
      const lignes = r.data?.data || r.data || [];
      setDeliveryLignes(lignes);
      if (lignes.length > 0) {
        setDeliveryLigne(lignes[0]);
        setDeliveryOpen(true);
      } else {
        showNotif('Aucune ligne à délivrer', 'error');
      }
    } catch (_) {
      showNotif('Erreur chargement lignes', 'error');
    } finally { setDeliveryLoading(false); }
  };

  const filtres = ordonnances.filter(o => {
    const q = search.toLowerCase();
    const client = patients.find(p => p.id === o.clientId);
    return !q || client?.nom?.toLowerCase().includes(q) || o.medecin?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const badgeColor = { blue: 'bg-blue-500/20 text-blue-400', amber: 'bg-amber-500/20 text-amber-400', emerald: 'bg-emerald-500/20 text-emerald-400', red: 'bg-red-500/20 text-red-400' };

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📝 Ordonnances</h1>
          <p className="text-slate-400 text-sm mt-1">{ordonnances.length} ordonnance{ordonnances.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouvelle Ordonnance
        </button>
        )}
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Rechercher une ordonnance..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Patient</th>
                <th className="text-left px-5 py-4">Médecin</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">Aucune ordonnance trouvée</td></tr>
              ) : paginated.map(o => {
                const client = patients.find(p => p.id === o.clientId);
                const s = STATUTS[o.statut] || STATUTS.EN_COURS;
                return (
                  <tr key={o.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold text-sm">{client?.nom || '—'}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{o.medecin || '—'}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{o.dateEmise ? new Date(o.dateEmise).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor[s.color]}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDelivery(o)}
                          className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 text-sm transition-colors" title="Délivrer">💊</button>
                        {perm.canEdit && (
                        <button onClick={() => { setEditItem(o); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors" title="Modifier">✏️</button>
                        )}
                        {perm.canDelete && (
                        <button onClick={() => setConfirmDelete(o)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 text-sm transition-colors" title="Annuler">🚫</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} ordonnance{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && <OrdonnanceForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Ordonnance modifiée ✓' : 'Ordonnance créée ✓'); load(); }} edit={editItem} />}

      {deliveryLignes.length > 1 && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${deliveryOpen ? '' : 'hidden'}`} onClick={() => { setDeliveryOpen(false); setDeliveryLignes([]); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black text-lg mb-4">💊 Délivrance - Sélectionnez une ligne</h3>
            {deliveryLignes.map((ligne, idx) => {
              const reste = ligne.quantitePrescrite - (ligne.quantiteDelivree || 0);

  return (
                <button key={ligne.id} onClick={() => { setDeliveryLigne(ligne); }}
                  className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${deliveryLigne?.id === ligne.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50 hover:bg-slate-700'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">{ligne.medicament?.designation || `Médicament #${idx + 1}`}</p>
                      <p className="text-slate-400 text-xs">Prescrit: {ligne.quantitePrescrite} | Reste: {reste}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${reste > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{reste > 0 ? 'À délivrer' : 'Complète'}</span>
                  </div>
                </button>
              );
            })}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setDeliveryOpen(true); }} disabled={!deliveryLigne}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors">Délivrer</button>
              <button onClick={() => { setDeliveryOpen(false); setDeliveryLignes([]); setDeliveryLigne(null); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <DelivranceForm isOpen={deliveryOpen && deliveryLigne && deliveryLignes.length <= 1} onClose={() => { setDeliveryOpen(false); setDeliveryLigne(null); setDeliveryLignes([]); }} onSuccess={() => { showNotif('Délivrance enregistrée ✓'); load(); setDeliveryOpen(false); setDeliveryLigne(null); setDeliveryLignes([]); }} metier="pharmacie" ordonnanceLigne={deliveryLigne} />

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Annuler l'ordonnance"
          message={`Êtes-vous sûr de vouloir annuler cette ordonnance ?`}
        />
      )}
    </div>
  );
}
