import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import ClientForm from '../../../shared/forms/ClientForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const LIMIT = 100;

export default function ClientsPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [showModal, setShowModal] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [search, setSearch] = useState('');
  const [filtreDebiteur, setFiltreDebiteur] = useState('');
  const [paiementData, setPaiementData] = useState({ montant: '', modePaiement: 'CASH' });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  // Fetch clients via useQuery
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['depot-clients', { search, filtreDebiteur }],
    queryFn: async () => {
      const params = { page: 1, limit: LIMIT, search, debiteur: filtreDebiteur || undefined };
      const res = await depotApi.getClients(params);
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data || []);
  const total = clients.length;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(clients, 10);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (c) => { setEditItem(c); setFormOpen(true); };

  const payerDetteMutation = useMutation({
    mutationFn: ({ clientId, montant, modePaiement }) =>
      depotApi.payerDette(clientId, { montant, modePaiement }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-clients'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Paiement enregistré avec succès');
      setShowModal(null);
      setSelectedClient(null);
      setPaiementData({ montant: '', modePaiement: 'CASH' });
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors du paiement');
    }
  });

  const handlePayerDette = (clientId) => {
    if (!paiementData.montant || isNaN(paiementData.montant)) return;
    payerDetteMutation.mutate({
      clientId,
      montant: parseInt(paiementData.montant),
      modePaiement: paiementData.modePaiement
    });
  };

  const handleVoirHistorique = async (client) => {
    try {
      const res = await depotApi.historiqueAchats(client.id);
      setHistorique(res.data?.data || res.data || []);
      setSelectedClient(client);
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur de chargement de l\'historique');
    }
  };

  if (isLoading && totalItems === 0) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{total} client{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20">
          ➕ Nouveau client
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="🔍 Rechercher un client..." value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500" />
        <select value={filtreDebiteur} onChange={e => { setFiltreDebiteur(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none">
          <option value="">Tous les clients</option>
          <option value="true">Clients débiteurs</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-semibold">Nom</th>
              <th className="text-left p-4 font-semibold">Téléphone</th>
              <th className="text-left p-4 font-semibold">Adresse</th>
              <th className="text-right p-4 font-semibold">Crédit / Dette</th>
              <th className="text-right p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {totalItems === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-500">
                  <p className="text-lg mb-2">Aucun client</p>
                  <p className="text-sm">Ajoutez votre premier client</p>
                </td>
              </tr>
            ) : paginated.map(c => {
              const soldeCredit = Number(c.soldeCredit || 0);
              return (
                <tr key={c.id} className={`hover:bg-slate-800/40 transition-colors ${soldeCredit > 0 ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4 text-white font-medium">{c.nom}</td>
                  <td className="p-4 text-slate-400">{c.telephone || '-'}</td>
                  <td className="p-4 text-slate-400">{c.adresse || '-'}</td>
                  <td className="p-4 text-right">
                    {soldeCredit > 0 ? (
                      <span className="text-red-400 font-bold">Dette: {soldeCredit.toLocaleString('fr-FR')} FCFA</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Pas de dette</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {soldeCredit > 0 && (
                        <button onClick={() => { setSelectedClient(c); setShowModal('paiement'); }}
                          title="Paiement dette" className="px-2.5 py-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all text-xs">💵 Régler</button>
                      )}
                      <button onClick={() => handleVoirHistorique(c)}
                        title="Historique achats" className="px-2.5 py-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-all text-xs">📋 Achats</button>
                      <button onClick={() => openEdit(c)} title="Modifier" className="px-2.5 py-1.5 hover:bg-orange-500/20 rounded-lg text-orange-400 hover:text-orange-300 transition-all text-xs">✏️ Modifier</button>
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
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      {selectedClient && showModal !== 'paiement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClient(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Historique - {selectedClient.nom}</h2>
              <button onClick={() => setSelectedClient(null)} className="text-slate-500 hover:text-white transition-all">✕</button>
            </div>
            {historique.length === 0 ? (
              <p className="text-slate-500 text-center py-6">Aucun achat enregistré</p>
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
            <p className="text-sm text-slate-400 mb-4">Client: {selectedClient.nom} - Dette: {Number(selectedClient.soldeCredit || 0).toLocaleString('fr-FR')} FCFA</p>
            <div className="space-y-4">
              <input type="number" placeholder="Montant à payer" value={paiementData.montant}
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
              <button onClick={() => handlePayerDette(selectedClient.id)} disabled={payerDetteMutation.isPending}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {payerDetteMutation.isPending ? 'Enregistrement...' : 'Enregistrer paiement'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ClientForm isOpen={formOpen} onClose={() => setFormOpen(false)} edit={editItem} metier="depot-boissons" />
      <ConfirmModal isOpen={!!confirmDelete} onConfirm={() => setConfirmDelete(null)} onCancel={() => setConfirmDelete(null)}
        title="Supprimer" message={`Supprimer ce client ? Cette action est irréversible.`} />
    </div>
  );
}
