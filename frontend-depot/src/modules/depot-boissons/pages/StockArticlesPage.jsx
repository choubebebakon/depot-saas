import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { depotApi } from '../services/depotApi';
import ArticleBoissonsForm from '../forms/ArticleBoissonsForm';
import ConditionnementForm from '../forms/ConditionnementForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import ArticleImage from '../../../components/ArticleImage';
import { Package, Search, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';

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

const LIMIT = 100;

export default function StockArticlesPage() {
  const { metier, user } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { canWrite } = usePermission('stock_articles');
  const [filtreFamille, setFiltreFamille] = useState('');
  const [filtreStock, setFiltreStock] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [conditionnementOpen, setConditionnementOpen] = useState(false);
  const [activeStockAction, setActiveStockAction] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  if (metier !== 'DEPOT_BOISSONS') return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;

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
  const { currentPage, setCurrentPage, nextPage, prevPage, totalPages, totalItems, paginatedData: paginated } = usePagination(articles, 10);
  const families = [...new Set(articles.map(a => a.famille).filter(Boolean))];
  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (a) => { setEditItem(a); setFormOpen(true); };

  const archiveMutation = useMutation({
    mutationFn: (id) => depotApi.archiveArticle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depot-articles'] }); queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] }); notif.success('Article archivé avec succès'); setConfirmDelete(null); },
    onError: (err) => notif.error(err.response?.data?.message || "Erreur lors de l'archivage"),
  });
  const entreeMutation = useMutation({
    mutationFn: (data) => depotApi.entreStock(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depot-articles'] }); queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] }); notif.success('Entrée de stock enregistrée'); setActiveStockAction(null); setSelectedArticle(null); },
    onError: (err) => notif.error(err.response?.data?.message || "Erreur lors de l'entrée de stock"),
  });
  const sortieMutation = useMutation({
    mutationFn: (data) => depotApi.sortieStock(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depot-articles'] }); queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] }); notif.success('Sortie de stock enregistrée'); setActiveStockAction(null); setSelectedArticle(null); },
    onError: (err) => notif.error(err.response?.data?.message || "Erreur lors de la sortie de stock"),
  });
  const transfertMutation = useMutation({
    mutationFn: (data) => depotApi.transfertStock(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depot-articles'] }); queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] }); notif.success('Transfert de stock enregistré'); setActiveStockAction(null); setSelectedArticle(null); },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors du transfert'),
  });

  const handleDelete = () => { if (confirmDelete) archiveMutation.mutate(confirmDelete.id); };
  const handleEntreeStock = (article) => { setSelectedArticle(article); setActiveStockAction('entree'); };
  const handleSortieStock = (article) => { setSelectedArticle(article); setActiveStockAction('sortie'); };
  const handleTransfert = (article) => { setSelectedArticle(article); setActiveStockAction('transfert'); };
  const handleHistory = async (article) => { setSelectedArticle(article); try { const res = await depotApi.getStockHistory(article.id); setHistoryData(res.data?.data || res.data || []); setActiveStockAction('history'); } catch { notif.error("Erreur lors de la récupération de l'historique"); } };

  const handleStockActionSubmit = (data) => {
    const depotId = selectedArticle?.depotId || user?.depotActif?.id;
    if (!depotId) { notif.error('Impossible de déterminer le dépôt. Veuillez sélectionner un dépôt actif.'); return; }
    const payload = { articleId: selectedArticle.id, depotId, ...data };
    if (activeStockAction === 'entree') entreeMutation.mutate(payload);
    else if (activeStockAction === 'sortie') sortieMutation.mutate(payload);
    else if (activeStockAction === 'transfert') transfertMutation.mutate(payload);
  };

  if (isLoading && totalItems === 0) return <div className="p-6 space-y-6"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}</div></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black text-white tracking-tight">Stock & Articles</h1><p className="text-slate-400 text-sm mt-1">{total} article{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p></div>
        {canWrite && <div className="flex flex-wrap gap-2"><button onClick={openCreate} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Nouvel article</button><button onClick={() => setConditionnementOpen(true)} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm">Conditionnement</button></div>}
      </div>
      <div className="flex flex-wrap gap-3"><input type="text" placeholder="Rechercher un article..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none" /><select value={filtreFamille} onChange={e => { setFiltreFamille(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"><option value="">Toutes familles</option>{families.map(f => <option key={f} value={f}>{f}</option>)}</select><select value={filtreStock} onChange={e => { setFiltreStock(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"><option value="">Tous statuts</option><option value="critique">Stock critique</option><option value="faible">Stock faible</option><option value="ok">Stock OK</option></select></div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50"><table className="w-full text-sm"><thead><tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider"><th className="text-left p-4 font-semibold">Article</th><th className="text-left p-4 font-semibold">Format</th><th className="text-left p-4 font-semibold">Famille</th><th className="text-right p-4 font-semibold">Stock</th><th className="text-right p-4 font-semibold">Seuil</th><th className="text-right p-4 font-semibold">Prix</th><th className="text-center p-4 font-semibold">Statut</th><th className="text-right p-4 font-semibold">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-700/30">{totalItems === 0 && !isLoading ? <tr><td colSpan="8" className="p-12 text-center text-slate-500"><p className="text-lg mb-2">Aucun article trouvé</p><p className="text-sm">Cliquez sur "Nouvel article" pour commencer</p></td></tr> : paginated.map(a => { const status = getStockStatus(a.quantite, a.seuil); return <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
          <td className="p-4"><div className="flex items-center gap-3"><ArticleImage src={a.photoUrl} alt={a.designation} className="w-12 h-12 rounded-lg object-cover shrink-0" /><div><p className="text-white font-medium">{a.designation}</p>{a.reference && <p className="text-slate-500 text-xs">{a.reference}</p>}</div></div></td>
          <td className="p-4 text-slate-400">{a.format || '-'}</td><td className="p-4 text-slate-400">{a.famille || '-'}</td><td className={`p-4 text-right font-bold ${a.quantite <= a.seuil ? 'text-red-400' : 'text-emerald-400'}`}>{a.quantite}</td><td className="p-4 text-right text-slate-400">{a.seuil}</td><td className="p-4 text-right text-white font-medium">{a.prix ? `${parseInt(a.prix).toLocaleString('fr-FR')} FCFA` : '-'}</td><td className="p-4 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status]}`}>{status === 'critique' ? 'CRITIQUE' : status === 'faible' ? 'FAIBLE' : status === 'moyen' ? 'MOYEN' : 'OK'}</span></td>
          <td className="p-4 text-right"><div className="flex items-center justify-end gap-1">{canWrite && <><button onClick={() => openEdit(a)} className="p-1.5 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-400 text-xs">Modifier</button><button onClick={() => handleEntreeStock(a)} className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 text-xs">Entrée</button><button onClick={() => handleSortieStock(a)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 text-xs">Sortie</button><button onClick={() => handleTransfert(a)} className="p-1.5 hover:bg-purple-500/20 rounded-lg text-slate-400 hover:text-purple-400 text-xs">Transfert</button></>}<button onClick={() => handleHistory(a)} className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 text-xs">Hist.</button>{canWrite && <button onClick={() => setConfirmDelete(a)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 text-xs">Archiver</button>}</div></td>
        </tr>; })}</tbody></table></div>

      {totalPages > 1 && <div className="flex items-center justify-center gap-2"><button disabled={currentPage <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">◀ Précédent</button><span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span><button disabled={currentPage >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40">Suivant ▶</button></div>}
      <ArticleBoissonsForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ConditionnementForm isOpen={conditionnementOpen} onClose={() => setConditionnementOpen(false)} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={archiveMutation.isPending} title="Archiver l'article" message={`Archiver ${confirmDelete?.designation} ? Cette action est irréversible.`} />
      <FormModal isOpen={activeStockAction === 'entree'} onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }} onSubmit={data => handleStockActionSubmit({ quantite: parseInt(data.quantite) })} title="📥 Entrée de stock" loading={entreeMutation.isPending} size="sm" submitLabel="Valider" submitDisabled={!selectedArticle?.depotId && !user?.depotActif?.id}><FormField label="Quantité à ajouter" name="quantite" type="number" min="1" required placeholder="0" /></FormModal>
      <FormModal isOpen={activeStockAction === 'sortie'} onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }} onSubmit={data => handleStockActionSubmit({ quantite: parseInt(data.quantite) })} title="📤 Sortie de stock" loading={sortieMutation.isPending} size="sm" submitLabel="Valider" submitDisabled={!selectedArticle?.depotId && !user?.depotActif?.id}><FormField label="Quantité à retirer" name="quantite" type="number" min="1" max={selectedArticle?.quantite} required placeholder="0" /></FormModal>
      <FormModal isOpen={activeStockAction === 'transfert'} onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }} onSubmit={data => handleStockActionSubmit({ quantite: parseInt(data.quantite), depotDestination: data.depotDestination })} title="🔄 Transfert de stock" loading={transfertMutation.isPending} size="sm" submitLabel="Valider" submitDisabled={!selectedArticle?.depotId && !user?.depotActif?.id}><FormField label="Quantité à transférer" name="quantite" type="number" min="1" max={selectedArticle?.quantite} required placeholder="0" /><FormField label="Dépôt de destination" name="depotDestination" required placeholder="ID ou nom du dépôt" /></FormModal>
      <FormModal isOpen={activeStockAction === 'history'} onClose={() => { setActiveStockAction(null); setSelectedArticle(null); setHistoryData(null); }} onSubmit={() => { setActiveStockAction(null); setSelectedArticle(null); setHistoryData(null); }} title="📋 Historique des mouvements" size="md" submitLabel="Fermer" showCancel={false}><div className="space-y-4">{historyData && historyData.length > 0 ? <div className="max-h-96 overflow-y-auto space-y-2">{historyData.map((h, idx) => <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50"><div className="flex justify-between"><p className="text-white font-semibold text-sm">{h.type || 'Mouvement'}</p><p className="text-slate-400 text-xs">{h.date || ''}</p></div><p className="text-slate-400 text-xs mt-1">Quantité : {h.quantite ?? '-'} · Dépôt : {h.depot || '-'}</p></div>)}</div> : <div className="text-center text-slate-500 py-8">Aucun mouvement enregistré</div>}</div></FormModal>
    </div>
  );
}
