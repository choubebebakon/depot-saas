import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../shared/hooks/usePermission';
import { useDepot } from '../../../contexts/DepotContext';
import { depotApi } from '../services/depotApi';
import ConsigneForm from '../forms/ConsigneForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

export default function ConsignesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const { canWrite } = usePermission('consignes');
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;

  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const clientsQuery = useQuery({
    queryKey: ['depot-clients', depotId],
    queryFn: async () => {
      const res = await depotApi.getClients({ limit: 100, depotId });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId),
  });

  const clients = Array.isArray(clientsQuery.data)
    ? clientsQuery.data
    : (clientsQuery.data?.data || []);

  const consignesQuery = useQuery({
    queryKey: ['depot-consignes-client', depotId, selectedClient?.id],
    queryFn: async () => {
      const res = await depotApi.getConsignesClient(selectedClient.id, { depotId });
      return res.data;
    },
    enabled: metier === 'DEPOT_BOISSONS' && Boolean(depotId && selectedClient?.id),
  });

  useEffect(() => {
    if (!depotId) {
      setSelectedClient(null);
      setFormOpen(false);
      setEditItem(null);
    }
  }, [depotId]);

  useEffect(() => {
    if (selectedClient && !clients.some((client) => client.id === selectedClient.id)) {
      setSelectedClient(null);
    }
  }, [clients, selectedClient]);

  const openForm = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    if (selectedClient) {
      queryClient.invalidateQueries({
        queryKey: ['depot-consignes-client', depotId, selectedClient.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['depot-clients', depotId] });
  };

  const filteredClients = clients.filter((c) =>
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.telephone?.includes(search),
  );

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  if (!depotId) {
    return <div className="p-6 text-center text-red-400 font-bold">Dépôt non sélectionné</div>;
  }

  if (clientsQuery.isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />)}
      </div>
    );
  }

  if (clientsQuery.isError) {
    return (
      <div className="p-6 text-center text-red-400">
        Impossible de charger les clients de ce dépôt.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Gestion des Consignes</h1>
        <p className="text-slate-400 text-sm mt-1">Portefeuille consignes du dépôt actif</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-slate-500"
          />

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-lg mb-1">Aucun client</p>
                <p className="text-sm">Ajoutez des clients pour gérer les consignes</p>
              </div>
            ) : filteredClients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedClient?.id === c.id
                  ? 'bg-blue-600/20 border-blue-500/50 text-white'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <p className="font-bold text-sm">{c.nom}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.telephone || '-'}</p>
                {c.soldeConsigne > 0 && (
                  <p className="text-xs font-bold text-amber-400 mt-1">
                    {parseInt(c.soldeConsigne, 10).toLocaleString('fr-FR')} FCFA
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-3xl mb-3">↻</p>
              <p className="text-lg font-medium">Sélectionnez un client</p>
              <p className="text-sm mt-1">Pour voir et gérer son portefeuille de consignes</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedClient.nom}</h2>
                    <p className="text-sm text-slate-400">{selectedClient.telephone || 'Aucun téléphone'}</p>
                  </div>
                  {canWrite && (
                    <button
                      onClick={openForm}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      Nouveau mouvement
                    </button>
                  )}
                </div>

                {consignesQuery.isLoading ? (
                  <div className="animate-pulse h-12 bg-slate-700/30 rounded-xl" />
                ) : consignesQuery.isError ? (
                  <div className="p-4 text-center text-red-400 bg-red-500/5 rounded-xl">
                    Impossible de charger le portefeuille de ce client.
                  </div>
                ) : consignesQuery.data ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {Object.entries(consignesQuery.data.portefeuille || {}).map(([type, qte]) => (
                      <div key={type} className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">{type}</p>
                        <p className="text-xl font-black text-white mt-1">{qte}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {consignesQuery.data?.soldeTotal > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center mt-3">
                    <p className="text-xs text-amber-400 uppercase tracking-wider">Valeur totale consignes</p>
                    <p className="text-xl font-black text-amber-400">
                      {parseInt(consignesQuery.data.soldeTotal, 10).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Historique des consignes</h3>
                {consignesQuery.isLoading ? (
                  <div className="animate-pulse h-10 bg-slate-700/20 rounded-lg" />
                ) : (!consignesQuery.data?.historique || consignesQuery.data.historique.length === 0) ? (
                  <p className="text-slate-500 text-sm text-center py-4">Aucun mouvement de consigne</p>
                ) : (
                  <div className="space-y-2">
                    {consignesQuery.data.historique.slice(0, 20).map((h, i) => (
                      <div key={h.id || `${h.createdAt}-${i}`} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span>{h.estSortie ? '📤' : '📥'}</span>
                          <div>
                            <p className="text-sm text-white font-medium">{h.typeConsigne?.type || h.typeConsigneId || 'Mouvement'}</p>
                            <p className="text-xs text-slate-500">{new Date(h.createdAt || h.date).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${h.estSortie ? 'text-red-400' : 'text-emerald-400'}`}>
                          {h.estSortie ? '-' : '+'}{h.quantite}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConsigneForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        edit={editItem}
        metier="depot-boissons"
        depotId={depotId}
      />
      <ConfirmModal
        isOpen={false}
        onConfirm={() => {}}
        onCancel={() => {}}
        title="Supprimer"
        message="Supprimer ce mouvement ? Cette action est irréversible."
      />
    </div>
  );
}
