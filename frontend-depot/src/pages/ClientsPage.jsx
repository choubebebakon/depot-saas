import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../context/NotifContext';
import { useAuth } from '../contexts/AuthContext';
import { useDepot } from '../contexts/DepotContext';
import api from '../api/axios';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { generateId } from '../utils/offline';

function BadgeSolde({ solde, plafond }) {
  if (solde <= 0)
    return <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">Soldé</span>;
  const pct = plafond > 0 ? (solde / plafond) * 100 : 100;
  const couleur = pct >= 90 ? 'red' : pct >= 60 ? 'orange' : 'yellow';
  const classes = {
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };
  return <span className={`text-xs font-bold border px-2 py-1 rounded-lg ${classes[couleur]}`}>{solde.toLocaleString('fr-FR')} FCFA</span>;
}

function ModalNouveauClient({ tenantId, depotId, onSuccess, onClose }) {
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', plafondCredit: 0 });
  const { success, error: notifError } = useNotif();
  const { addToQueue } = useOfflineSync();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        await addToQueue('POST', '/clients', payload);
        return { ...payload, status: 'QUEUED_OFFLINE' };
      }
      const res = await api.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      success('Client créé');
      onSuccess();
      onClose();
    },
    onError: (err) => notifError(err.response?.data?.message || 'Erreur création', 'Échec'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createClientMutation.mutate({ id: generateId(), ...form, tenantId, depotId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-black text-xl mb-6">Nouveau Client</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom *</label>
            <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Jean Dupont"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="+237 6XX XXX XXX"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label>
            <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })}
              placeholder="Douala, Akwa..."
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Plafond Crédit (FCFA)</label>
            <input type="number" min="0" value={form.plafondCredit}
              onChange={e => setForm({ ...form, plafondCredit: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all">Annuler</button>
            <button type="submit" disabled={createClientMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
              {createClientMutation.isPending ? 'Création...' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalPaiement({ client, tenantId, onSuccess, onClose }) {
  const [montant, setMontant] = useState('');
  const { success, error: notifError } = useNotif();
  const { addToQueue } = useOfflineSync();
  const queryClient = useQueryClient();

  const payerDetteMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        await addToQueue('PATCH', `/clients/${client.id}/payer`, payload);
        return { ...payload, status: 'QUEUED_OFFLINE' };
      }
      const res = await api.patch(`/clients/${client.id}/payer`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      success('Paiement enregistré');
      onSuccess();
      onClose();
    },
    onError: (err) => notifError(err.response?.data?.message || 'Erreur paiement', 'Échec'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    payerDetteMutation.mutate({ montant: Number(montant), tenantId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-black text-xl mb-2">Paiement Ardoise</h3>
        <p className="text-slate-400 text-sm mb-6">
          Client : <strong className="text-white">{client.nom}</strong><br />
          Dette actuelle : <strong className="text-red-400">{client.soldeCredit.toLocaleString('fr-FR')} FCFA</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Montant reçu (FCFA)</label>
            <input type="number" required min="1" max={client.soldeCredit} value={montant}
              onChange={e => setMontant(e.target.value)} placeholder="Ex: 5000"
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-center text-xl font-bold" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1000, 2000, 5000].map(val => (
              <button key={val} type="button" onClick={() => setMontant(Math.min(val, client.soldeCredit).toString())}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-all">{val.toLocaleString()} F</button>
            ))}
          </div>
          <button type="button" onClick={() => setMontant(client.soldeCredit.toString())}
            className="w-full border border-dashed border-emerald-500/40 hover:border-emerald-500 text-emerald-400 text-sm font-bold py-2 rounded-xl transition-all">
            Tout régler — {client.soldeCredit.toLocaleString('fr-FR')} FCFA
          </button>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl">Annuler</button>
            <button type="submit" disabled={payerDetteMutation.isPending || !montant}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all">
              {payerDetteMutation.isPending ? '...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { metier: metierAuth, tenantId } = useAuth();
  const { depotId } = useDepot();
  const queryClient = useQueryClient();
  const { success, error: notifError } = useNotif();

  const [recherche, setRecherche] = useState('');
  const [modalNouvel, setModalNouvel] = useState(false);
  const [clientPaiement, setClientPaiement] = useState(null);
  const [filtreDetteOnly, setFiltreDetteOnly] = useState(false);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { tenantId, depotId } });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const { data: stats = { totalDu: 0, nbClientsEnDette: 0 }, isLoading: loadingStats } = useQuery({
    queryKey: ['clients-stats', tenantId, depotId],
    queryFn: async () => {
      const res = await api.get('/clients/stats/ardoise', { params: { tenantId, depotId } });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-stats'] });
      success('Client supprimé');
    },
    onError: () => {
      notifError('Erreur lors de la suppression', 'Échec');
    }
  });

  const loading = loadingClients || loadingStats;

  const clientsFiltres = useMemo(() => {
    return clients.filter(c => {
      const matchRecherche = c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        (c.telephone || '').includes(recherche);
      const matchDette = filtreDetteOnly ? c.soldeCredit > 0 : true;
      return matchRecherche && matchDette;
    });
  }, [clients, recherche, filtreDetteOnly]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Clients & Ardoise</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion des clients et suivi des crédits</p>
        </div>
        <button onClick={() => setModalNouvel(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm flex items-center gap-2">
          + Nouveau Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Clients</p>
          <p className="text-white text-3xl font-black">{clients.length}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Ardoise Totale</p>
          <p className="text-white text-3xl font-black">{stats.totalDu.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">En Dette</p>
          <p className="text-white text-3xl font-black">{stats.nbClientsEnDette} <span className="text-lg text-slate-400">clients</span></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou téléphone..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
        <button onClick={() => setFiltreDetteOnly(!filtreDetteOnly)}
          className={`px-5 py-3 rounded-xl text-sm font-bold border transition-all ${filtreDetteOnly
            ? 'bg-red-500/20 border-red-500/40 text-red-400'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}>
          {filtreDetteOnly ? 'Avec dettes seulement' : 'Tous les clients'}
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 animate-pulse text-slate-500 text-sm">Chargement des clients...</div>
        ) : clientsFiltres.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">{String.fromCodePoint(0x1F464)}</p>
            <p className="font-semibold">{recherche ? 'Aucun client trouvé' : 'Aucun client encore'}</p>
            {!recherche && (
              <button onClick={() => setModalNouvel(true)}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold">+ Créer le premier client</button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-700">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Téléphone</th>
                <th className="px-6 py-4">Plafond</th>
                <th className="px-6 py-4">Ardoise</th>
                <th className="px-6 py-4">Achats</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {clientsFiltres.map(client => (
                <tr key={client.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                        {client.nom[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{client.nom}</p>
                        {client.adresse && <p className="text-slate-500 text-xs">{client.adresse}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{client.telephone || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {client.plafondCredit > 0 ? `${client.plafondCredit.toLocaleString('fr-FR')} FCFA` : <span className="text-slate-600">Aucun</span>}
                  </td>
                  <td className="px-6 py-4"><BadgeSolde solde={client.soldeCredit} plafond={client.plafondCredit} /></td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{client._count?.ventes || 0} vente(s)</td>
                  <td className="px-6 py-4 text-right">
                    {client.soldeCredit > 0 && (
                      <button onClick={() => setClientPaiement(client)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                        Encaisser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalNouvel && <ModalNouveauClient tenantId={tenantId} depotId={depotId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clients'] })} onClose={() => setModalNouvel(false)} />}
      {clientPaiement && (
        <ModalPaiement client={clientPaiement} tenantId={tenantId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clients'] })} onClose={() => setClientPaiement(null)} />
      )}
    </div>
  );
}
