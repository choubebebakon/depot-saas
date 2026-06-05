import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import ChambreForm from '../forms/ChambreForm';
import TypeChambreForm from '../forms/TypeChambreForm';
import CheckInForm from '../forms/CheckInForm';
import CheckOutForm from '../forms/CheckOutForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const TYPES_CHAMBRE = ['Simple', 'Double', 'Suite', 'Suite Premium', 'Suite Présidentielle'];
const STATUTS_CHAMBRE = ['Disponible', 'Occupée', 'En ménage', 'En maintenance', 'Réservée'];

const badgeStatut = (s) => {
  const m = { 'Disponible': 'bg-emerald-500/20 text-emerald-400', 'Occupée': 'bg-blue-500/20 text-blue-400', 'En ménage': 'bg-yellow-500/20 text-yellow-400', 'En maintenance': 'bg-red-500/20 text-red-400', 'Réservée': 'bg-violet-500/20 text-violet-400' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m[s] || 'bg-slate-500/20 text-slate-400'}`}>{s}</span>;
};

export default function ChambresPage() {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [typeChambreOpen, setTypeChambreOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false); const [checkInReservation, setCheckInReservation] = useState(null);
  const [checkOutOpen, setCheckOutOpen] = useState(false); const [checkOutReservation, setCheckOutReservation] = useState(null);

  const load = useCallback(async () => { setLoading(true);
    try { const res = await api.get('/hotel/chambres'); setChambres(res.data?.data || res.data || []); }
    catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setFormOpen(true); };
  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/hotel/chambres/${confirmDelete.id}`); setConfirmDelete(null); load(); }
    catch { alert('Erreur lors de la suppression'); } finally { setDeleting(false); }
  };

  const filtres = chambres.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.numero?.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    const matchStatut = !filtreStatut || c.statut === filtreStatut;
    const matchType = !filtreType || c.type === filtreType;
    return matchSearch && matchStatut && matchType;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">🛏️ Chambres</h1>
          <p className="text-slate-400 text-sm mt-1">{chambres.length} chambre{chambres.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
          + Nouvelle Chambre
        </button>
        <button onClick={() => setTypeChambreOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          🏷️ Type chambre
        </button>
        <button onClick={() => setCheckInOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
          ✅ Check-in
        </button>
        <button onClick={() => setCheckOutOpen(true)}
          className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-500/20">
          🧾 Check-out
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 focus:border-violet-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-60" />
        <select value={filtreStatut} onChange={e => { setFiltreStatut(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous statuts</option>
          {STATUTS_CHAMBRE.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtreType} onChange={e => { setFiltreType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous types</option>
          {TYPES_CHAMBRE.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">N°</th>
                <th className="text-left px-5 py-4">Type</th>
                <th className="text-right px-5 py-4">Prix/nuit</th>
                <th className="text-center px-5 py-4">Capacité</th>
                <th className="text-center px-5 py-4">Étage</th>
                <th className="text-center px-5 py-4">Statut</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucune chambre trouvée</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-black text-sm">{c.numero}</div>
                      <span className="text-white font-semibold text-sm">N° {c.numero}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.type}</td>
                  <td className="px-5 py-4 text-right text-white font-mono font-bold">{(c.prix || 0).toLocaleString('fr-FR')} F</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">{c.capacite} pers.</td>
                  <td className="px-5 py-4 text-center text-slate-300 text-sm">Étage {c.etage || '—'}</td>
                  <td className="px-5 py-4 text-center">{badgeStatut(c.statut)}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">✏️</button>
                      <button onClick={() => setConfirmDelete(c)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-700 text-sm transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} chambre{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2); const p = start + i;
                  if (p > totalPages) return null;
                  return (<button key={p} onClick={() => goToPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>);
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ChambreForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} />
      <TypeChambreForm isOpen={typeChambreOpen} onClose={() => setTypeChambreOpen(false)} onSuccess={() => load()} metier="hotel" />
      <CheckInForm isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} onSuccess={() => load()} metier="hotel" reservation={checkInReservation} />
      <CheckOutForm isOpen={checkOutOpen} onClose={() => setCheckOutOpen(false)} onSuccess={() => load()} metier="hotel" reservation={checkOutReservation} />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer la chambre" message={`Supprimer la chambre N° ${confirmDelete?.numero} ? Cette action est irréversible.`} />
    </div>
  );
}
