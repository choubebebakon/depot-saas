import { useState, useEffect, useCallback } from 'react'; import api from '../../../api';
import ArticleSupermarcheForm from '../forms/ArticleSupermarcheForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

const STATUTS = [
  { id: 'tous', label: 'Tous' },
  { id: 'disponible', label: 'En stock', color: 'emerald' },
  { id: 'faible', label: 'Stock faible', color: 'amber' },
  { id: 'rupture', label: 'Rupture', color: 'red' },
];

function StockBadge({ qte, seuil }) {
  if (qte <= 0) return <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400">Rupture</span>;
  if (qte <= (seuil || 5)) return <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">Faible</span>;
  return <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">OK</span>;
}

export default function StockPage() {
  const [produits, setProduits] = useState([]);
  const [rayons, setRayons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [search, setSearch] = useState('');
  const [rayonFiltre, setRayonFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [notif, setNotif] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); const [deleting, setDeleting] = useState(false);
  const perm = usePermission(PERMISSIONS, 'stock');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const load = useCallback(async () => { setLoading(true);
    try { const [p, r] = await Promise.all([api.get('/supermarche/produits'), api.get('/supermarche/rayons')]); setProduits(p.data?.data || p.data || []); setRayons(r.data?.data || r.data || []); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showNotif = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const handleDelete = async () => {
    if (!confirmDelete) return; setDeleting(true);
    try { await api.delete(`/supermarche/produits/${confirmDelete.id}`); setConfirmDelete(null); showNotif('Produit supprimé'); load(); }
    catch { showNotif('Erreur lors de la suppression', 'error'); } finally { setDeleting(false); }
  };

  const filtres = produits.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || p.codeBarres?.includes(q);
    const matchRayon = !rayonFiltre || p.rayonId === rayonFiltre;
    const matchStatut = filtre === 'tous' || (filtre === 'rupture' && p.stock <= 0) || (filtre === 'faible' && p.stock > 0 && p.stock <= (p.seuilAlerte || 5)) || (filtre === 'disponible' && p.stock > (p.seuilAlerte || 5));
    return matchSearch && matchRayon && matchStatut;
  });

  const totalPages = Math.ceil(filtres.length / itemsPerPage);
  const paginated = filtres.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="p-6">
      {notif && <div className={`fixed top-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm ${notif.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>{notif.msg}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">📦 Gestion du Stock</h1>
          <p className="text-slate-400 text-sm mt-1">{filtres.length} produit{filtres.length !== 1 ? 's' : ''} affiché{filtres.length !== 1 ? 's' : ''}</p>
        </div>
        {perm.canCreate && (
        <button onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20">
          + Nouveau Produit
        </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64" />
        <select value={rayonFiltre} onChange={e => setRayonFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none">
          <option value="">Tous les rayons</option>
          {rayons.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select>
        <div className="flex gap-1">
          {STATUTS.map(s => (
            <button key={s.id} onClick={() => setFiltre(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filtre === s.id ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="text-left px-5 py-4">Produit</th>
                  <th className="text-left px-5 py-4">Rayon</th>
                  <th className="text-right px-5 py-4">Prix Vente</th>
                  <th className="text-right px-5 py-4">Prix Achat</th>
                  <th className="text-right px-5 py-4">Stock</th>
                  <th className="text-center px-5 py-4">Statut</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtres.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-slate-500">Aucun produit trouvé</td></tr>
                ) : paginated.map(p => {
                  const rayon = rayons.find(r => r.id === p.rayonId);

  return (
                    <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-semibold text-sm">{p.nom}</p>
                        <p className="text-slate-500 text-xs">{p.reference || p.codeBarres || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full">{rayon?.nom || '—'}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">{(p.prix || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-5 py-4 text-right text-slate-400 text-sm">{(p.prixAchat || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-bold text-sm ${p.stock <= 0 ? 'text-red-400' : p.stock <= (p.seuilAlerte || 5) ? 'text-amber-400' : 'text-white'}`}>
                          {p.stock ?? 0} {p.unite || ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center"><StockBadge qte={p.stock} seuil={p.seuilAlerte} /></td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {perm.canEdit && (
                          <button onClick={() => { setEditItem(p); setFormOpen(true); }}
                            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm" title="Modifier">✏️</button>
                          )}
                          {perm.canDelete && (
                          <button onClick={() => setConfirmDelete(p)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm" title="Supprimer">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <span className="text-slate-400 text-xs">{filtres.length} produit{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">◀</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === p ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{p}</button>
                  );
                })}
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">▶</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ArticleSupermarcheForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => { showNotif(editItem ? 'Produit modifié ✓' : 'Produit créé ✓'); load(); }} edit={editItem} metier="supermarche" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer le produit" message={`Supprimer « ${confirmDelete?.nom} » ? Cette action est irréversible.`} />
    </div>
  );
}
