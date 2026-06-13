import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import ArticleBoissonsForm from '../forms/ArticleBoissonsForm';
import ConditionnementForm from '../forms/ConditionnementForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const STATUS_COLORS = {
  critique: 'bg-red-500/10 text-red-400 border-red-500/30',
  faible: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  moyen: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

function getStockStatus(quantite, seuil) {
  if (quantite <= 0) return 'critique';
  if (quantite <= seuil * 0.5) return 'critique';
  if (quantite <= seuil) return 'faible';
  if (quantite <= seuil * 2) return 'moyen';
  return 'ok';
}

const LIMIT = 100; // Increase backend limit so client-side pagination has full access to filtered dataset

export default function StockArticlesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [filtreFamille, setFiltreFamille] = useState('');
  const [filtreStock, setFiltreStock] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [conditionnementOpen, setConditionnementOpen] = useState(false);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  // Fetch articles via useQuery
  const { data, isLoading } = useQuery({
    queryKey: ['depot-articles', { search, filtreFamille, filtreStock }],
    queryFn: async () => {
      const params = { page: 1, limit: LIMIT, search, famille: filtreFamille, stock: filtreStock };
      const res = await depotApi.getArticles(params);
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const articles = Array.isArray(data) ? data : (data?.data || []);
  const total = articles.length;

  const filtres = articles;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(filtres, 10);

  const families = [...new Set(articles.map(a => a.famille).filter(Boolean))];

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (a) => { setEditItem(a); setFormOpen(true); };

  const archiveMutation = useMutation({
    mutationFn: (id) => depotApi.archiveArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Article archivé avec succès');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'archivage');
    }
  });

  const entreeMutation = useMutation({
    mutationFn: (data) => depotApi.entreStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Entrée de stock enregistrée');
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'entrée de stock');
    }
  });

  const sortieMutation = useMutation({
    mutationFn: (data) => depotApi.sortieStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Sortie de stock enregistrée');
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la sortie de stock');
    }
  });

  const transfertMutation = useMutation({
    mutationFn: (data) => depotApi.transfertStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Transfert de stock enregistré');
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors du transfert');
    }
  });

  const handleDelete = () => {
    if (confirmDelete) {
      archiveMutation.mutate(confirmDelete.id);
    }
  };

  const handleEntreeStock = (id) => {
    const qte = prompt('Quantité à ajouter :');
    if (!qte || isNaN(qte)) return;
    entreeMutation.mutate({ articleId: id, quantite: parseInt(qte) });
  };

  const handleSortieStock = (id) => {
    const qte = prompt('Quantité à retirer :');
    if (!qte || isNaN(qte)) return;
    sortieMutation.mutate({ articleId: id, quantite: parseInt(qte) });
  };

  const handleTransfert = (id) => {
    const qte = prompt('Quantité à transférer :');
    if (!qte || isNaN(qte)) return;
    const depotDest = prompt('Dépôt de destination :');
    if (!depotDest) return;
    transfertMutation.mutate({ articleId: id, quantite: parseInt(qte), depotDestination: depotDest });
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Stock & Articles</h1>
          <p className="text-slate-400 text-sm mt-1">{total} article{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
            ➕ Nouvel article
          </button>
          <button onClick={() => setConditionnementOpen(true)} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20">
            📦 Conditionnement
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="🔍 Rechercher un article..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
        <select value={filtreFamille} onChange={e => { setFiltreFamille(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Toutes familles</option>
          {families.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filtreStock} onChange={e => { setFiltreStock(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous statuts</option>
          <option value="critique">Stock critique</option>
          <option value="faible">Stock faible</option>
          <option value="ok">Stock OK</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-semibold">Désignation</th>
              <th className="text-left p-4 font-semibold">Format</th>
              <th className="text-left p-4 font-semibold">Famille</th>
              <th className="text-right p-4 font-semibold">Stock</th>
              <th className="text-right p-4 font-semibold">Seuil</th>
              <th className="text-right p-4 font-semibold">Prix</th>
              <th className="text-center p-4 font-semibold">Statut</th>
              <th className="text-right p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {totalItems === 0 && !isLoading ? (
              <tr>
                <td colSpan="8" className="p-12 text-center text-slate-500">
                  <p className="text-lg mb-2">Aucun article trouvé</p>
                  <p className="text-sm">Cliquez sur "Nouvel article" pour commencer</p>
                </td>
              </tr>
            ) : paginated.map((a) => {
              const status = getStockStatus(a.quantite, a.seuil);
              return (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-white font-medium">{a.designation}</td>
                  <td className="p-4 text-slate-400">{a.format || '-'}</td>
                  <td className="p-4 text-slate-400">{a.famille || '-'}</td>
                  <td className={`p-4 text-right font-bold ${a.quantite <= a.seuil ? 'text-red-400' : 'text-emerald-400'}`}>
                    {a.quantite}
                  </td>
                  <td className="p-4 text-right text-slate-400">{a.seuil}</td>
                  <td className="p-4 text-right text-white font-medium">
                    {a.prix ? `${parseInt(a.prix).toLocaleString('fr-FR')} FCFA` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status]}`}>
                      {status === 'critique' ? 'CRITIQUE' : status === 'faible' ? 'FAIBLE' : status === 'moyen' ? 'MOYEN' : 'OK'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(a)} title="Modifier" className="p-1.5 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-400 transition-all text-xs">✏️ Modifier</button>
                      <button onClick={() => handleEntreeStock(a.id)} title="Entrée stock" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all text-xs">📥 Entrée</button>
                      <button onClick={() => handleSortieStock(a.id)} title="Sortie stock" className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all text-xs">📤 Sortie</button>
                      <button onClick={() => handleTransfert(a.id)} title="Transférer" className="p-1.5 hover:bg-purple-500/20 rounded-lg text-slate-400 hover:text-purple-400 transition-all text-xs">🔄 Transfert</button>
                      <button onClick={() => depotApi.getStockHistory(a.id).then(r => alert(JSON.stringify(r.data, null, 2)))} title="Historique" className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-all text-xs">📋 Hist.</button>
                      <button onClick={() => setConfirmDelete(a)} title="Archiver" className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={currentPage <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      <ArticleBoissonsForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ConditionnementForm isOpen={conditionnementOpen} onClose={() => setConditionnementOpen(false)} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={archiveMutation.isPending}
        title="Archiver l'article" message={`Archiver ${confirmDelete?.designation} ? Cette action est irréversible.`} />
    </div>
  );
}
