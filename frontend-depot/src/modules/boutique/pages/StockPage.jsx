import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useActions } from '../../../shared/hooks/useActions';
import { PERMISSIONS } from '../permissions';
import { useDepot } from '../../../contexts/DepotContext';
import StockBoutiqueForm from '../forms/StockBoutiqueForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { boutiqueApi } from '../services/boutiqueApi';
import { Search, Edit, Trash2, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Package } from 'lucide-react';

const formatExpiration = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date invalide';
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
};

const expirationState = (value) => {
  if (!value) return 'none';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 'invalid';
  const now = Date.now();
  if (time <= now) return 'expired';
  if (time <= now + 7 * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
};

export default function StockPage() {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { depotId } = useDepot();
  const { hasAction } = useActions();
  const [search, setSearch] = useState('');
  const [categorieFiltre, setCategorieFiltre] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeStockAction, setActiveStockAction] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const perm = usePermission(PERMISSIONS, 'stock');

  const { data: categories } = useQuery({
    queryKey: ['boutique-categories'],
    queryFn: async () => {
      const res = await boutiqueApi.getCategories();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['boutique-stock', { search, categorieId: categorieFiltre, depotId }],
    queryFn: async () => {
      const res = await boutiqueApi.getStock({ search, categorieId: categorieFiltre, depotId });
      return res.data;
    },
  });

  // Normalisation : le backend renvoie des lignes de stock
  // { quantite, article: {...} } — les infos produit vivent dans `article`.
  const items = (stockData?.data || []).map((row) => {
    const art = row.article || {};
    return {
      stockRowId: row.id,
      id: art.id || row.articleId,
      quantite: row.quantite ?? 0,
      depotId: row.depotId,
      designation: art.designation || '',
      codeBarres: art.codeBarres || '',
      photoUrl: art.photoUrl || null,
      prixVente: art.prixVente ?? 0,
      prixAchat: art.prixAchat ?? 0,
      seuilCritique: art.seuilCritique ?? 0,
      datePeremption: art.datePeremption || null,
      categorieId: art.categorieId || null,
    };
  });
  const totalItems = stockData?.total || 0;
  const valueStock = items.reduce((acc, i) => acc + (i.prixVente || 0) * (i.quantite || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (id) => boutiqueApi.deleteArticle(id),
    onSuccess: () => {
      notif.success('Article supprimé');
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'], exact: false });
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la suppression'),
  });

  const entreeMutation = useMutation({
    mutationFn: (payload) => boutiqueApi.entreStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'], exact: false });
      notif.success('Entrée de stock enregistrée');
      setActiveStockAction(null);
      setSelectedArticle(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de l\'entrée de stock'),
  });

  const sortieMutation = useMutation({
    mutationFn: (payload) => boutiqueApi.sortieStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'], exact: false });
      notif.success('Sortie de stock enregistrée');
      setActiveStockAction(null);
      setSelectedArticle(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la sortie de stock'),
  });

  const transfertMutation = useMutation({
    mutationFn: (payload) => boutiqueApi.transfertStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'], exact: false });
      notif.success('Transfert de stock enregistré');
      setActiveStockAction(null);
      setSelectedArticle(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors du transfert'),
  });

  const handleDelete = () => {
    if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
  };

  const handleEntreeStock = (article) => {
    setSelectedArticle(article);
    setActiveStockAction('entree');
  };

  const handleSortieStock = (article) => {
    setSelectedArticle(article);
    setActiveStockAction('sortie');
  };

  const handleTransfert = (article) => {
    setSelectedArticle(article);
    setActiveStockAction('transfert');
  };

  const handleHistory = async (article) => {
    setSelectedArticle(article);
    try {
      const res = await boutiqueApi.getStockHistory(article.id);
      const raw = res?.data?.data || res?.data?.mouvements || res?.data?.historique || res?.data || [];
      const historyList = Array.isArray(raw) ? raw : (raw.mouvements || raw.historique || raw.data || []);
      setHistoryData(Array.isArray(historyList) ? historyList : []);
      setActiveStockAction('history');
    } catch (err) {
      notif.error('Erreur lors de la récupération de l\'historique');
      setHistoryData([]);
    }
  };

  const handleStockActionSubmit = (formData) => {
    const finalDepotId = selectedArticle?.depotId || depotId;
    if (!finalDepotId) {
      notif.error("Impossible de déterminer le dépôt. Veuillez sélectionner un dépôt actif.");
      return;
    }

    let rawQuantite = formData;
    let depotDestination = null;

    if (formData && typeof formData === 'object') {
      if ('quantite' in formData) {
        rawQuantite = formData.quantite;
      }
      if ('depotDestination' in formData) {
        depotDestination = formData.depotDestination;
      }
      if (formData.target && formData.target.elements) {
        rawQuantite = formData.target.elements.namedItem('quantite')?.value;
        depotDestination = formData.target.elements.namedItem('depotDestination')?.value;
      }
    }

    const parsedQuantite = parseInt(rawQuantite, 10);
    if (isNaN(parsedQuantite) || parsedQuantite <= 0) {
      notif.error("La quantité doit être un entier valide supérieur à 0.");
      return;
    }

    const payload = {
      articleId: selectedArticle.id,
      depotId: finalDepotId,
      quantite: parsedQuantite,
      ...(depotDestination && { depotDestination }),
    };

    if (activeStockAction === 'entree') {
      entreeMutation.mutate(payload);
    } else if (activeStockAction === 'sortie') {
      sortieMutation.mutate(payload);
    } else if (activeStockAction === 'transfert') {
      transfertMutation.mutate(payload);
    }
  };

  const isDepotMissing = !selectedArticle?.depotId && !depotId;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Stock</h1>
          <p className="text-slate-400 text-sm mt-1">{totalItems} produit{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Valeur stock</p>
            <p className="font-black text-xl text-cyan-400">{valueStock.toLocaleString('fr-FR')} F</p>
          </div>
          {perm.canCreate && (
            <button onClick={() => { setEditItem(null); setFormOpen(true); }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-600/20">
              + Nouveau Produit
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <input type="text" placeholder="Nom produit..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-72" />
        <select value={categorieFiltre} onChange={e => setCategorieFiltre(e.target.value)}
          className="bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Toutes catégories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left px-5 py-4">Produit</th><th className="text-right px-5 py-4">Qt</th>
                <th className="text-right px-5 py-4">Seuil</th><th className="text-right px-5 py-4">Prix achat</th>
                <th className="text-right px-5 py-4">Prix vente</th><th className="text-center px-5 py-4">Péremption</th>
                <th className="text-center px-5 py-4">Statut</th><th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.length === 0 ? <tr><td colSpan={8} className="text-center py-16 text-slate-500">Aucun produit</td></tr> : items.map(i => {
                const alerte = i.quantite <= i.seuilCritique;
                const expState = expirationState(i.datePeremption);
                return (
                  <tr key={i.stockRowId || i.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {i.photoUrl ? (
                          <img src={i.photoUrl} alt={i.designation} referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-700/40 shrink-0 border border-slate-700/40" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-700/40 flex items-center justify-center text-slate-500 shrink-0"><Package className="w-5 h-5" /></div>
                        )}
                        <div>
                          <p className="text-white font-semibold text-sm">{i.designation || 'Sans nom'}</p>
                          {i.codeBarres && <p className="text-slate-500 text-xs">{i.codeBarres}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-right font-mono font-bold ${alerte ? 'text-red-400' : 'text-white'}`}>{i.quantite}</td>
                    <td className="px-5 py-4 text-right text-slate-300">{i.seuilCritique || 0}</td>
                    <td className="px-5 py-4 text-right text-slate-300">{(i.prixAchat || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-right text-green-400">{(i.prixVente || 0).toLocaleString('fr-FR')} F</td>
                    <td className="px-5 py-4 text-center text-xs">
                      <span className={expState === 'expired' ? 'text-red-400 font-bold' : expState === 'soon' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {formatExpiration(i.datePeremption)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {alerte ? <span className="text-[10px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Critique</span> :
                        expState === 'expired' ? <span className="text-[10px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Expiré</span> :
                        expState === 'soon' ? <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Bientôt</span> :
                        <span className="text-[10px] font-black uppercase bg-green-500/20 text-green-400 px-2 py-1 rounded-full">OK</span>}
                    </td>
                    <td className="px-5 py-4 text-center"><div className="flex justify-center gap-1 flex-wrap">
                      {perm.canEdit && <button onClick={() => { setEditItem(i); setFormOpen(true); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 text-sm"><Edit className="w-4 h-4" /> Modifier</button>}
                      {perm.canWrite && (
                        <>
                          <button onClick={() => handleEntreeStock(i)} title="Entrée stock" className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"><ArrowDownToLine className="w-4 h-4" /> Entrée</button>
                          <button onClick={() => handleSortieStock(i)} title="Sortie stock" className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"><ArrowUpFromLine className="w-4 h-4" /> Sortie</button>
                          {hasAction('stock.transferer') && <button onClick={() => handleTransfert(i)} title="Transférer" className="text-slate-400 hover:text-purple-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"><RefreshCw className="w-4 h-4" /> Transfert</button>}
                        </>
                      )}
                      <button onClick={() => handleHistory(i)} title="Historique" className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"><Package className="w-4 h-4" /> Hist.</button>
                      {perm.canDelete && <button onClick={() => setConfirmDelete(i)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 text-sm"><Trash2 className="w-4 h-4" /> Supprimer</button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && <StockBoutiqueForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={() => setFormOpen(false)} edit={editItem} />}
      {confirmDelete && <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)}
        title="Supprimer le produit" message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete.designation}" ?`} loading={deleteMutation.isPending} />}

      {/* Modal Entrée Stock */}
      <FormModal
        isOpen={activeStockAction === 'entree'}
        onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }}
        onSubmit={handleStockActionSubmit}
        title="📥 Entrée de stock"
        loading={entreeMutation.isPending}
        size="sm"
        submitLabel="Valider"
        submitDisabled={isDepotMissing}
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Article: <span className="text-white font-semibold">{selectedArticle?.designation}</span></p>
            <p className="text-slate-400 text-sm">Stock actuel: <span className="text-emerald-400 font-bold">{selectedArticle?.quantite}</span></p>
            <p className="text-slate-400 text-sm">Dépôt ID: <span className={(selectedArticle?.depotId || depotId) ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{selectedArticle?.depotId || depotId || "Non défini"}</span></p>
          </div>
          {isDepotMissing && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              ⚠️ Dépôt non défini. Veuillez sélectionner un dépôt actif.
            </div>
          )}
          <FormField
            label="Quantité à ajouter"
            name="quantite"
            type="number"
            min="1"
            required
            placeholder="0"
          />
        </div>
      </FormModal>

      {/* Modal Sortie Stock */}
      <FormModal
        isOpen={activeStockAction === 'sortie'}
        onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }}
        onSubmit={handleStockActionSubmit}
        title="📤 Sortie de stock"
        loading={sortieMutation.isPending}
        size="sm"
        submitLabel="Valider"
        submitDisabled={isDepotMissing}
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Article: <span className="text-white font-semibold">{selectedArticle?.designation}</span></p>
            <p className="text-slate-400 text-sm">Stock actuel: <span className="text-emerald-400 font-bold">{selectedArticle?.quantite}</span></p>
            <p className="text-slate-400 text-sm">Dépôt ID: <span className={(selectedArticle?.depotId || depotId) ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{selectedArticle?.depotId || depotId || "Non défini"}</span></p>
          </div>
          {isDepotMissing && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              ⚠️ Dépôt non défini. Veuillez sélectionner un dépôt actif.
            </div>
          )}
          <FormField
            label="Quantité à retirer"
            name="quantite"
            type="number"
            min="1"
            max={selectedArticle?.quantite}
            required
            placeholder="0"
          />
        </div>
      </FormModal>

      {/* Modal Transfert Stock */}
      <FormModal
        isOpen={activeStockAction === 'transfert'}
        onClose={() => { setActiveStockAction(null); setSelectedArticle(null); }}
        onSubmit={handleStockActionSubmit}
        title="🔄 Transfert de stock"
        loading={transfertMutation.isPending}
        size="sm"
        submitLabel="Valider"
        submitDisabled={isDepotMissing}
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Article: <span className="text-white font-semibold">{selectedArticle?.designation}</span></p>
            <p className="text-slate-400 text-sm">Stock actuel: <span className="text-emerald-400 font-bold">{selectedArticle?.quantite}</span></p>
            <p className="text-slate-400 text-sm">Dépôt ID: <span className={(selectedArticle?.depotId || depotId) ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{selectedArticle?.depotId || depotId || "Non défini"}</span></p>
          </div>
          {isDepotMissing && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              ⚠️ Dépôt non défini. Veuillez sélectionner un dépôt actif.
            </div>
          )}
          <FormField
            label="Quantité à transférer"
            name="quantite"
            type="number"
            min="1"
            max={selectedArticle?.quantite}
            required
            placeholder="0"
          />
          <FormField
            label="Dépôt de destination"
            name="depotDestination"
            required
            placeholder="ID ou nom du dépôt"
          />
        </div>
      </FormModal>

      {/* Modal Historique */}
      <FormModal
        isOpen={activeStockAction === 'history'}
        onClose={() => { setActiveStockAction(null); setSelectedArticle(null); setHistoryData([]); }}
        onSubmit={() => { setActiveStockAction(null); setSelectedArticle(null); setHistoryData([]); }}
        title="📋 Historique des mouvements"
        size="md"
        submitLabel="Fermer"
        showCancel={false}
      >
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-slate-400 text-sm">Article: <span className="text-white font-semibold">{selectedArticle?.designation}</span></p>
          </div>
          {historyData && historyData.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {historyData.map((h, idx) => {
                const typeMvt = h.type || h.action || h.libelle || 'Mouvement';
                const qtyMvt = h.quantite ?? h.qty ?? h.valeur ?? 0;
                const dateMvt = h.date || h.createdAt || h.dateMouvement || new Date().toLocaleString('fr-FR');
                const depotNom = h.depot || h.depotNom || h.nomDepot || '-';

                return (
                  <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold text-sm capitalize">{typeMvt}</p>
                        <p className="text-slate-400 text-xs">
                          {typeof dateMvt === 'string' && !dateMvt.includes('T') ? dateMvt : new Date(dateMvt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${String(typeMvt).toLowerCase().includes('entree') || qtyMvt > 0 ? 'text-emerald-400' : String(typeMvt).toLowerCase().includes('sortie') ? 'text-red-400' : 'text-slate-400'}`}>
                          {qtyMvt ? `${qtyMvt > 0 ? '+' : ''}${qtyMvt}` : '-'}
                        </p>
                        <p className="text-slate-500 text-xs">{depotNom}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              <p className="text-sm">Aucun mouvement enregistré</p>
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}
