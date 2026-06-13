import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useSectorQuery } from '../../../hooks/useSectorQuery';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { PERMISSIONS } from '../permissions';
import { supermarcheApi } from '../services/supermarcheApi';
import ArticleSupermarcheForm from '../forms/ArticleSupermarcheForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const FILTRES_STOCK = [
  { id: '', label: 'Tous' },
  { id: 'rupture', label: 'Rupture' },
  { id: 'faible', label: 'Stock faible' },
  { id: 'ok', label: 'OK' },
];

function getArticleStock(article) {
  const stocks = article.stocks || [];
  return stocks.reduce((sum, s) => sum + (s.quantite || 0), 0);
}

function getArticleRayonId(article) {
  return article.rayons?.[0]?.rayonId || article.rayonId || '';
}

function StockBadge({ qte, seuil = 5 }) {
  if (qte <= 0) {
    return (
      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">
        Rupture
      </span>
    );
  }
  if (qte <= seuil) {
    return (
      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/30">
        Faible
      </span>
    );
  }
  return (
    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
      OK
    </span>
  );
}

export default function StockPage() {
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();
  const perm = usePermission(PERMISSIONS, 'stock');

  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('');
  const [rayonFiltre, setRayonFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: produits = [], isLoading } = useSectorQuery(
    ['supermarche-articles', { search, filtre, rayonFiltre }],
    async () => {
      const res = await supermarcheApi.getProduits({ search, limit: 100 });
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  );

  const { data: rayons = [] } = useSectorQuery(
    ['supermarche-rayons'],
    async () => {
      const res = await supermarcheApi.getRayons();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  );

  const filtres = produits.filter((item) => {
    const qte = getArticleStock(item);
    const seuil = item.seuilCritique ?? 5;
    if (search && !JSON.stringify(item).toLowerCase().includes(search.toLowerCase())) return false;
    if (rayonFiltre && getArticleRayonId(item) !== rayonFiltre) return false;
    if (filtre === 'rupture') return qte <= 0;
    if (filtre === 'faible') return qte > 0 && qte <= seuil;
    if (filtre === 'ok') return qte > seuil;
    return true;
  });

  const {
    currentPage: page,
    goToPage,
    totalPages,
    paginatedData: paginated,
  } = usePagination(filtres, 10);

  const deleteMutation = useMutation({
    mutationFn: (id) => supermarcheApi.deleteProduit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      success('Produit supprimé');
      setConfirmDelete(null);
    },
    onError: () => {
      notifError('Erreur lors de la suppression', 'Échec');
    },
  });

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate(confirmDelete.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Gestion du Stock</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filtres.length} produit{filtres.length !== 1 ? 's' : ''} affich{filtres.length !== 1 ? 's' : ''}
          </p>
        </div>
        {perm.canCreate && (
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            + Nouveau Produit
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2 text-sm outline-none w-64"
        />
        <select
          value={rayonFiltre}
          onChange={(e) => setRayonFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none"
        >
          <option value="">Tous les rayons</option>
          {rayons.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {FILTRES_STOCK.map((s) => (
            <button
              key={s.id}
              onClick={() => setFiltre(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                filtre === s.id ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
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
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">Aucun produit trouvé</td>
                  </tr>
                ) : paginated.map((p) => {
                  const stock = getArticleStock(p);
                  const seuil = p.seuilCritique ?? 5;
                  const rayon = rayons.find((r) => r.id === getArticleRayonId(p));

                  return (
                    <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-semibold text-sm">{p.designation}</p>
                        <p className="text-slate-500 text-xs">{p.codeBarres || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full">
                          {rayon?.nom || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-amber-400 font-bold text-sm">
                        {(p.prixVente || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-5 py-4 text-right text-slate-400 text-sm">
                        {(p.prixAchat || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-bold text-sm ${
                            stock <= 0 ? 'text-red-400' : stock <= seuil ? 'text-amber-400' : 'text-white'
                          }`}
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StockBadge qte={stock} seuil={seuil} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {perm.canEdit && (
                            <button
                              onClick={() => { setEditItem(p); setFormOpen(true); }}
                              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                              title="Modifier"
                            >
                              ✏️ Modifier
                            </button>
                          )}
                          {perm.canDelete && (
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                              title="Supprimer"
                            >
                              🗑️ Supprimer
                            </button>
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
              <span className="text-slate-400 text-xs">
                {filtres.length} produit{filtres.length > 1 ? 's' : ''} — Page {page}/{totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const pNum = start + i;
                  if (pNum > totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      onClick={() => goToPage(pNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        page === pNum ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ArticleSupermarcheForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
        }}
        edit={editItem}
      />
      <ConfirmModal
        isOpen={!!confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        loading={deleteMutation.isPending}
        title="Supprimer le produit"
        message={`Supprimer « ${confirmDelete?.designation} » ? Cette action est irréversible.`}
      />
    </div>
  );
}
