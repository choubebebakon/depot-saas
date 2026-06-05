import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';
import MedicamentForm from '../forms/MedicamentForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const FAMILLES = ['Antibiotiques', 'Antalgiques', 'Anti-inflammatoires', 'Vitamines', 'Cardiovasculaires', 'Digestifs', 'Respiratoires', 'Dermatologiques', 'Ophtalmologiques', 'Autre'];
const FORMES = ['Comprimé', 'Gélule', 'Sirop', 'Injectable', 'Pommade', 'Collyre', 'Suppositoire', 'Solution buvable', 'Poudre', 'Autre'];

export default function MedicamentsPage() {
  const [medicaments, setMedicaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [familleFiltre, setFamilleFiltre] = useState('');
  const [ordonnanceFiltre, setOrdonnanceFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [notif, setNotif] = useState(null);
  const [page, setPage] = useState(1);
  const perm = usePermission(PERMISSIONS, 'medicaments');
  const itemsPerPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, f] = await Promise.all([api.get('/pharmacie/medicaments'), api.get('/pharmacie/fournisseurs')]);
      setMedicaments(m.data?.data || m.data || []);
      setFournisseurs(f.data?.data || f.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.patch(`/pharmacie/medicaments/${confirmDelete.id}`, { actif: false });
      showNotif('Médicament supprimé ✓');
      setConfirmDelete(null);
      load();
    } catch (_) { showNotif('Erreur lors de la suppression', 'error'); }
  };

  const filtres = medicaments.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.designation?.toLowerCase().includes(q) || m.famille?.toLowerCase().includes(q) || m.dosage?.toLowerCase().includes(q);
    const matchFamille = !familleFiltre || m.famille === familleFiltre;
    const matchOrdo = !ordonnanceFiltre || (ordonnanceFiltre === 'ordonnance' && m.surOrdonnance) || (ordonnanceFiltre === 'libre' && !m.surOrdonnance);
    return matchSearch && matchFamille && matchOrdo;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">💊 Médicaments</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} médicament{filtres.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          + Nouveau Médicament
        </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-emerald-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64" />
        <select value={familleFiltre} onChange={e => { setFamilleFiltre(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Toutes familles</option>
          {FAMILLES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={ordonnanceFiltre} onChange={e => { setOrdonnanceFiltre(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Tous</option>
          <option value="ordonnance">🔴 Sur ordonnance</option>
          <option value="libre">🟢 Libre</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="text-left px-5 py-4">Médicament</th>
                  <th className="text-left px-5 py-4">Famille</th>
                  <th className="text-right px-5 py-4">Prix</th>
                  <th className="text-right px-5 py-4">Stock</th>
                  <th className="text-center px-5 py-4">Statut</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-500">Aucun médicament trouvé</td></tr>
                ) : paginated.map(m => (
                  <tr key={m.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {m.surOrdonnance && <span className="text-xs" title="Sur ordonnance">🔴</span>}
                        <div>
                          <p className="text-white font-semibold text-sm">{m.designation}</p>
                          <p className="text-slate-500 text-xs">{m.dosage || ''} — {m.formeGalenique || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full">{m.famille}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-emerald-400 font-bold text-sm">{(m.prix || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold text-sm ${(m.stock || 0) <= 0 ? 'text-red-400' : (m.stock || 0) <= (m.seuilAlerte || 10) ? 'text-amber-400' : 'text-white'}`}>
                        {m.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {(m.stock || 0) <= 0
                        ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400">Rupture</span>
                        : (m.stock || 0) <= (m.seuilAlerte || 10)
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">Faible</span>
                          : <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">OK</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-center">
                      {perm.canEdit && (
                      <div className="flex items-center justify-center gap-1">
                        {perm.canEdit && (
                        <button onClick={() => { setEditItem(m); setFormOpen(true); }}
                          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm" title="Modifier">✏️</button>
                        )}
                        {perm.canDelete && (
                        <button onClick={() => setConfirmDelete(m)}
                          className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm" title="Supprimer">🗑️</button>
                        )}
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} médicament{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
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

      {formOpen && <MedicamentForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Médicament modifié ✓' : 'Médicament créé ✓'); load(); }} edit={editItem} />}

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          title="Supprimer le médicament"
          message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.designation}" ?`}
        />
      )}
    </div>
  );
}
