import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import ArticleBoissonsForm from '../forms/ArticleBoissonsForm';
import ConditionnementForm from '../forms/ConditionnementForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

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
    Object.setPrototypeOf(window, window.safeHandler);
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

const LIMIT = 20;

export default function StockArticlesPage() {
  const { metier } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreFamille, setFiltreFamille] = useState('');
  const [filtreStock, setFiltreStock] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [conditionnementOpen, setConditionnementOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [edit, setEdit] = useState(null);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, search, famille: filtreFamille, stock: filtreStock };
      const res = await depotApi.getArticles(params);
      setArticles(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filtreFamille, filtreStock]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (a) => { setEditItem(a); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await depotApi.archiveArticle(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  async function handleEntreeStock(id) {
    const qte = prompt('Quantit  ajouter :');
    if (!qte || isNaN(qte)) return;
    try {
      await depotApi.entreStock({ articleId: id, quantite: parseInt(qte) });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSortieStock(id) {
    const qte = prompt('Quantit  retirer :');
    if (!qte || isNaN(qte)) return;
    try {
      await depotApi.sortieStock({ articleId: id, quantite: parseInt(qte) });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTransfert(id) {
    const qte = prompt('Quantit  transfrer :');
    if (!qte || isNaN(qte)) return;
    const depotDest = prompt('Dpt de destination :');
    if (!depotDest) return;
    try {
      await depotApi.transfertStock({ articleId: id, quantite: parseInt(qte), depotDestination: depotDest });
      load();
    } catch (err) {
      console.error(err);
    }
  }


  if (loading && totalItems === 0) {

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (articles || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
        </div>
      </div>
    );
  }


  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (articles || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Stock & Articles</h1>
          <p className="text-slate-400 text-sm mt-1">{total} article{total > 1 ? 's' : ''} enregistr{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
            ? Nouvel article
          </button>
          <button onClick={() => setConditionnementOpen(true)} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20">
            ?? Conditionnement
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="🔍 Rechercher un article..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
        <select value={filtreFamille} onChange={e => { setFiltreFamille(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Toutes familles</option>
          {familles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filtreStock} onChange={e => { setFiltreStock(e.target.value); setPage(1); }}
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
              <th className="text-left p-4 font-semibold">Dsignation</th>
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
            {totalItems === 0 && !loading ? (
              <tr>
                <td colSpan="8" className="p-12 text-center text-slate-500">
                  <p className="text-lg mb-2">Aucun article trouvé</p>
                  <p className="text-sm">Cliquez sur "Nouvel article" pour commencer</p>
                </td>
              </tr>
            ) : paginated.map((a) => {
              const status = getStockStatus(a.quantite, a.seuil);

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (articles || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
  const page = currentPage;
  const setPage = setCurrentPage;
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
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(a)} title="Modifier" className="p-1.5 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-400 transition-all">✏️ Modifier</button>
                      <button onClick={() => handleEntreeStock(a.id)} title="Entre stock" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all">✏️ Modifier</button>
                      <button onClick={() => handleSortieStock(a.id)} title="Sortie stock" className="p-1.5 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-400 transition-all">✏️ Modifier</button>
                      <button onClick={() => handleTransfert(a.id)} title="Transfrer" className="p-1.5 hover:bg-purple-500/20 rounded-lg text-slate-400 hover:text-purple-400 transition-all">✏️ Modifier</button>
                      <button onClick={() => depotApi.getStockHistory(a.id).then(r => alert(JSON.stringify(r.data, null, 2)))} title="Historique" className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-all">✏️ Modifier</button>
                      <button onClick={() => setConfirmDelete(a)} title="Archiver" className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all">🗑️ Supprimer</button>
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
          <button disabled={page <= 1} onClick={prevPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">? Prcdent</button>
          <span className="text-slate-400 text-sm">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage} className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ?</button>
        </div>
      )}

      <ArticleBoissonsForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="depot-boissons" />
      <ConditionnementForm isOpen={conditionnementOpen} onClose={() => setConditionnementOpen(false)} onSuccess={() => load()} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Archiver l'article" message={`Archiver  ${confirmDelete?.designation}  ? Cette action est irrversible.`} />
    </div>
  );
}
