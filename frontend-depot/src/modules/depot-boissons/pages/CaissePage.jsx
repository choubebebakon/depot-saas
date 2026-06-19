import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import { venteSchema } from '../schemas/venteSchema';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

// Components de Modales indépendants pour une meilleure organisation

function OuvrirCaisseModal({ isOpen, onClose, onOpen }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { montant: '', motif: '' }
  });

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onOpen)} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-black text-white mb-4">🔓 Ouverture de caisse</h2>
        <div className="space-y-4">
          <div>
            <input
              type="number"
              placeholder="Montant initial (FCFA) *"
              {...register('montant', { required: 'Montant requis', min: { value: 0, message: 'Le montant doit être positif' } })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {errors.montant && <p className="text-red-400 text-xs mt-1">⚠️ {errors.montant.message}</p>}
          </div>
          <div>
            <input
              placeholder="Motif d'ouverture (optionnel)"
              {...register('motif')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
          <button type="submit"
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Ouvrir</button>
        </div>
      </form>
    </div>
  ) : null;
}

function VenteCaisseModal({ isOpen, onClose, onSubmit }) {
  const { data: clients } = useQuery({ queryKey: ['depot-clients'], queryFn: () => depotApi.getClients().then(res => res.data) });
  const { data: consignes } = useQuery({ queryKey: ['depot-conditionnements'], queryFn: () => depotApi.getConditionnements().then(res => res.data) });

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(venteSchema),
    defaultValues: {
      montant: '',
      motif: 'Vente comptoir',
      clientId: '',
      retoursConsigne: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "retoursConsigne" });

  // Normalisation des données pour parer au problème de ".map is not a function"
  const clientsList = Array.isArray(clients) ? clients : (clients?.data || []);
  const consignesList = Array.isArray(consignes) ? consignes : (consignes?.data || []);

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-black text-white mb-4">💰 Saisir une vente</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Client</label>
            <select
              {...register('clientId')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Client occasionnel --</option>
              {clientsList.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Montant total (FCFA) *"
              {...register('montant', { required: 'Montant requis', min: { value: 0, message: 'Le montant doit être positif' } })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {errors.montant && <p className="text-red-400 text-xs mt-1">⚠️ {errors.montant.message}</p>}
          </div>

          <div>
            <input
              placeholder="Description de la vente *"
              {...register('motif', { required: 'Description requis' })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {errors.motif && <p className="text-red-400 text-xs mt-1">⚠️ {errors.motif.message}</p>}
          </div>

          {/* SECTION RETOUR CONSIGNE */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">📦 Retours de vides (Consignes)</h3>
              <button
                type="button"
                onClick={() => append({ typeConsigneId: '', quantite: 1 })}
                className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-lg hover:bg-emerald-600/30 transition-colors"
              >
                + Ajouter un retour
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <div className="flex-1">
                    <select
                      {...register(`retoursConsigne.${index}.typeConsigneId`)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="">Sélectionner le format...</option>
                      {consignesList.map(c => (
                        <option key={c.id} value={c.id}>{c.nom} ({c.valeurConsigne} FCFA)</option>
                      ))}
                    </select>
                    {errors.retoursConsigne?.[index]?.typeConsigneId && (
                      <p className="text-red-400 text-[10px] mt-1">{errors.retoursConsigne[index].typeConsigneId.message}</p>
                    )}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qté"
                      {...register(`retoursConsigne.${index}.quantite`)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                    />
                    {errors.retoursConsigne?.[index]?.quantite && (
                      <p className="text-red-400 text-[10px] mt-1">{errors.retoursConsigne[index].quantite.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-center py-4 text-slate-600 text-xs italic border border-dashed border-slate-800 rounded-xl">
                  Aucun retour de bouteilles enregistré pour cette vente.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
          <button type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Enregistrer</button>
        </div>
      </form>
    </div>
  ) : null;
}

function MouvementCaisseModal({ isOpen, onClose, onSubmit }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { montant: '', motif: '', typeMouvement: 'ENTREE' }
  });

  const typeMouvement = watch('typeMouvement');

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-black text-white mb-4">Nouveau mouvement</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button type="button" onClick={() => setValue('typeMouvement', 'ENTREE')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${typeMouvement === 'ENTREE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📥 Entrée</button>
            <button type="button" onClick={() => setValue('typeMouvement', 'SORTIE')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${typeMouvement === 'SORTIE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>📤 Sortie</button>
          </div>
          <div>
            <input
              type="number"
              placeholder="Montant (FCFA) *"
              {...register('montant', { required: 'Montant requis', min: { value: 0, message: 'Le montant doit être positif' } })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {errors.montant && <p className="text-red-400 text-xs mt-1">⚠️ {errors.montant.message}</p>}
          </div>
          <div>
            <input
              placeholder="Motif *"
              {...register('motif', { required: 'Motif requis' })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
            />
            {errors.motif && <p className="text-red-400 text-xs mt-1">⚠️ {errors.motif.message}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Annuler</button>
          <button type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm">Valider</button>
        </div>
      </form>
    </div>
  ) : null;
}

export default function CaissePage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [showModal, setShowModal] = useState(null);
  const [confirmFermer, setConfirmFermer] = useState(null);
  const [rapportData, setRapportData] = useState(null);
  const [fetchingRapport, setFetchingRapport] = useState(false);

  // --- LOGIQUE MAILLÉE COMPORTANT LE DESÉRIALISATION DE DEPOT_USER ---
  const userString = localStorage.getItem('depot_user');
  let currentDepotId = null;
  let currentTenantId = null;

  if (userString) {
    try {
      const userData = JSON.parse(userString);
      currentDepotId = userData.depotId || userData.depot_id;
      currentTenantId = userData.tenantId || userData.tenant_id;
    } catch (e) {
      console.error("Erreur lors de l'analyse du JSON depot_user", e);
    }
  }
  // ------------------------------------------------------------------

  const { data: caisse, isLoading, error: queryError } = useQuery({
    queryKey: ['depot-caisse-statut'],
    queryFn: async () => {
      const res = await depotApi.getCaisseStatut();
      return res.data;
    },
    refetchInterval: 10_000,
    enabled: metier === 'DEPOT_BOISSONS'
  });

  const ouvrirMutation = useMutation({
    mutationFn: (data) => {
      if (!currentDepotId || !currentTenantId) throw new Error("Impossible d'ouvrir la caisse: ID du dépôt ou du tenant absent de la session.");
      return depotApi.ouvrirCaisse({ 
        montantInitial: parseInt(data.montant), 
        motif: data.motif, 
        depotId: currentDepotId, 
        tenantId: currentTenantId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut'] });
      notif.success('Caisse ouverte avec succès');
      setShowModal(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || "Erreur lors de l'ouverture de caisse");
    }
  });

  const venteMutation = useMutation({
    mutationFn: (data) => {
      return depotApi.createVente({ ...data, depotId: currentDepotId, tenantId: currentTenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut'] });
      notif.success('Vente et consignes enregistrées');
      setShowModal(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la vente')
  });

  const fermerMutation = useMutation({
    mutationFn: () => depotApi.fermerCaisse({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut'] });
      notif.success('Caisse fermée avec succès');
      setConfirmFermer(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la fermeture de caisse');
    }
  });

 const movimientoMutation = useMutation({
  mutationFn: (data) => depotApi.mouvementCaisse({
    montant: parseInt(data.montant),
    motif: data.motif,
    typeMouvement: data.typeMouvement,
    depotId: currentDepotId,   // ✨ Ajouté ici pour l'envoyer au backend
    tenantId: currentTenantId  // ✨ Ajouté ici pour l'envoyer au backend
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['depot-caisse-statut'] });
    notif.success('Mouvement enregistré avec succès');
    setShowModal(null);
  },
  onError: (err) => {
    notif.error(err.response?.data?.message || 'Erreur lors du mouvement');
  }
});

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  async function handleRapport() {
    setFetchingRapport(true);
    try {
      const res = await depotApi.rapportJournalier();
      setRapportData(res.data);
      setShowModal('rapport');
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur lors de la génération du rapport');
    } finally {
      setFetchingRapport(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-32 bg-slate-800/60 rounded-xl" />
        <div className="h-20 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="p-6 text-center text-red-400">
        Erreur de chargement de la caisse : {queryError.message}
      </div>
    );
  }

  const estOuverte = caisse?.statut === 'OUVERTE';
  const mouvements = caisse?.mouvements || [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">🏧 Caisse</h1>
          <p className="text-slate-400 text-sm mt-1">
            {estOuverte ? '🟢 Caisse ouverte' : '🔴 Caisse fermée'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!estOuverte ? (
            <button 
              onClick={() => setShowModal('ouvrir')} 
              disabled={!currentDepotId || !currentTenantId}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              🔓 Ouvrir caisse
            </button>
          ) : (
            <>
              <button onClick={() => setShowModal('vente')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                💰 Saisir vente
              </button>
              <button onClick={() => setShowModal('mouvement')}
                className="px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                ➕ Mouvement
              </button>
              <button onClick={() => setConfirmFermer(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
                🔒 Fermer caisse
              </button>
            </>
          )}
          <button onClick={handleRapport} disabled={fetchingRapport}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2">
            {fetchingRapport ? '⌛ Génération...' : '📊 Rapport journalier'}
          </button>
        </div>
      </div>

      {caisse && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Solde actuel</p>
            <p className="text-2xl font-black text-white mt-1">{(caisse.solde || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Entrées du jour</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">+{(caisse.entreesJour || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sorties du jour</p>
            <p className="text-2xl font-black text-red-400 mt-1">-{(caisse.sortiesJour || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Mouvements du jour</h2>
        {mouvements.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Aucun mouvement aujourd'hui</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {mouvements.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{m.typeMouvement === 'ENTREE' ? '📥' : '📤'}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{m.motif || 'Mouvement'}</p>
                    <p className="text-xs text-slate-500">{new Date(m.date).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${m.typeMouvement === 'ENTREE' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.typeMouvement === 'ENTREE' ? '+' : '-'}{(m.montant || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <OuvrirCaisseModal
        isOpen={showModal === 'ouvrir'}
        onClose={() => setShowModal(null)}
        onOpen={(data) => ouvrirMutation.mutate(data)}
      />

      <VenteCaisseModal
        isOpen={showModal === 'vente'}
        onClose={() => setShowModal(null)}
        onSubmit={(data) => venteMutation.mutate(data)}
      />

      <MouvementCaisseModal
        isOpen={showModal === 'mouvement'}
        onClose={() => setShowModal(null)}
        onSubmit={(data) => movimientoMutation.mutate(data)}
      />

      {showModal === 'rapport' && rapportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white mb-4">📊 Rapport journalier</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Statut</p>
                  <p className={`text-lg font-black mt-1 ${rapportData.statut === 'OUVERTE' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {rapportData.statut || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Solde</p>
                  <p className="text-lg font-black text-white mt-1">{(rapportData.solde || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Entrées du jour</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">+{(rapportData.entreesJour || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Sorties du jour</p>
                  <p className="text-lg font-black text-red-400 mt-1">-{(rapportData.sortiesJour || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmFermer} onConfirm={() => fermerMutation.mutate()} onCancel={() => setConfirmFermer(null)} loading={fermerMutation.isPending}
        title="Fermer la caisse" message="Fermer la caisse ? Un rapport journalier sera généré et les ventes ne pourront plus être enregistrées pour aujourd'hui." />
    </div>
  );
}