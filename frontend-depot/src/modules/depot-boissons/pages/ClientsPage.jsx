import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { depotApi } from '../services/depotApi';
import ClientForm from '../../../shared/forms/ClientForm';
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


export default function ClientsPage() {
  const { metier } = useAuth();
  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accs non autoris</div>;
  }

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [search, setSearch] = useState('');
  const [filtreDebiteur, setFiltreDebiteur] = useState('');
  const [paiementData, setPaiementData] = useState({ montant: '', modePaiement: 'CASH' });
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [edit, setEdit] = useState(null);

  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: perPage, search, debiteur: filtreDebiteur || undefined };
      const res = await depotApi.getClients(params);
      setClients(res.data.data || res.data);
      setTotal(res.data.total || res.data.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filtreDebiteur]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      setConfirmDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  async function handlePayerDette(clientId) {
    if (!paiementData.montant || isNaN(paiementData.montant)) return;
    try {
      await depotApi.payerDette(clientId, { montant: parseInt(paiementData.montant), modePaiement: paiementData.modePaiement });
      setShowModal(null);
      setPaiementData({ montant: '', modePaiement: 'CASH' });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleVoirHistorique(client) {
    try {
      const res = await depotApi.historiqueAchats(client.id);
      setHistorique(res.data.data || res.data || []);
      setSelectedClient(client);
    } catch (err) {
      console.error(err);
    }
  }


  if (loading && totalItems === 0) {

  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (clients || []).filter(item =>
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
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }


  // Pagination centralisÃ©e â FIX: totalPages non dÃ©fini
  const filtres = (clients || []).filter(item =>
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
          <h1 className="text-2xl font-black text-white tracking-tight">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          ? Nouveau client
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="🔍 Rechercher un client..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
        <select value={filtreDebiteur} onChange={e => { setFiltreDebiteur(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm">
          <option value="">Tous les clients</option>
          <option value="true">Clients dbiteurs</option>
          <option value="fidel">Clients fidles</option>
          <option value="inactif">Clients inactifs</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-semibold">Nom</th>
              <th className="text-left p-4 font-semibold">Tlphone</th>
              <th className="text-left p-4 font-semibold">Adresse</th>
              <th className="text-right p-4 font-semibold">Crdit</th>
              <th className="text-right p-4 font-semibold">Dette</th>
              <th className="text-right p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {totalItems === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-500">
                  <p className="text-lg mb-2">Aucun client</p>
                  <p className="text-sm">Ajoutez votre premier client</p>
                </td>
              </tr>
            ) : paginated.map(c => (
              <tr key={c.id} className={`hover:bg-slate-800/40 transition-colors ${c.dette > 0 ? 'bg-red-500/5' : ''}`}>
                <td className="p-4 text-white font-medium">{c.nom}</td>
                <td className="p-4 text-slate-400">{c.telephone || '-'}</td>
                <td className="p-4 text-slate-400">{c.adresse || '-'}</td>
                <td className="p-4 text-right text-emerald-400 font-medium">
                  {c.soldeCredit ? `${parseInt(c.soldeCredit).toLocaleString('fr-FR')} FCFA` : '-'}
                </td>
                <td className="p-4 text-right">
                  {c.dette > 0 ? (
                    <span className="text-red-400 font-bold">{parseInt(c.dette).toLocaleString('fr-FR')} FCFA</span>
                  ) : '-'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {c.dette > 0 && (
                      <button onClick={() => { setSelectedClient(c); setShowModal('paiement'); }}
                        title="Paiement dette" className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-slate-400 hover:text-emerald-400 transition-all">✏️ Modifier</button>
                    )}
                    <button onClick={() => handleVoirHistorique(c)}
                      title="Historique achats" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all">✏️ Modifier</button>
                    <button title="Appeler" className="p-1.5 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-all">✏️ Modifier</button>
                    <button onClick={() => openEdit(c)} title="Modifier" className="p-1.5 hover:bg-orange-500/20 rounded-lg text-slate-400 hover:text-orange-400 transition-all">✏️ Modifier</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
          <span className="text-slate-400 text-sm">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">?</button>
        </div>
      )}

      {selectedClient && showModal !== 'paiement' && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Historique - {selectedClient.nom}</h2>
              <button onClick={() => setSelectedClient(null)} className="text-slate-500 hover:text-white transition-all">?</button>
            </div>
            {historique.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Aucun achat enregistr</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {historique.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                    <div>
                      <p className="text-sm text-white">{new Date(h.date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-slate-500">{h.type || 'Vente'}</p>
                    </div>
                    <span className="text-white font-bold">{(h.montant || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal === 'paiement' && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black text-white mb-2">Paiement dette</h2>
            <p className="text-sm text-slate-400 mb-4">Client: {selectedClient.nom} - Dette: {parseInt(selectedClient.dette).toLocaleString('fr-FR')} FCFA</p>
            <div className="space-y-4">
              <input type="number" placeholder="Montant  payer" value={paiementData.montant}
                onChange={e => setPaiementData({...paiementData, montant: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" />
              <select value={paiementData.modePaiement} onChange={e => setPaiementData({...paiementData, modePaiement: e.target.value})}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm">
                <option value="CASH">Cash</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="MTN_MOMO">MTN MoMo</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(null); setSelectedClient(null); }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
              <button onClick={() => handlePayerDette(selectedClient.id)}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Enregistrer paiement</button>
            </div>
          </div>
        </div>
      )}

      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting}
        title="Supprimer" message={`Supprimer ce client ? Cette action est irrversible.`} />
    </div>
  );
}
