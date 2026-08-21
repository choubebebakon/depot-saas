import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDepot } from '../../../contexts/DepotContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { supermarcheApi } from '../services/supermarcheApi';
import POSSupermarcheForm from '../forms/POSSupermarcheForm';
import Receipt80mm from '../../../components/Receipt80mm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';
import api from '../../../api/axios';
import {
  Store, Lock, Unlock, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, BarChart3, ShoppingCart,
} from 'lucide-react';

// ─── Modale : Ouverture de caisse ──────────────────────────────────────────
function OuvrirCaisseModal({ isOpen, onClose, onOpen, isPending }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fondInitial: '', motif: '' },
  });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit(onOpen)}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Unlock className="w-5 h-5 text-emerald-400" /> Ouverture de caisse
        </h2>
        <div className="space-y-4">
          <div>
            <input
              type="number"
              placeholder="Fond de caisse initial (FCFA) *"
              {...register('fondInitial', {
                required: 'Fond initial requis',
                min: { value: 0, message: 'Le montant doit être positif' },
              })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {errors.fondInitial && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.fondInitial.message}
              </p>
            )}
          </div>
          <div>
            <input
              placeholder="Motif d'ouverture (optionnel)"
              {...register('motif')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm"
          >
            {isPending ? '⌛ Ouverture...' : '🔓 Ouvrir la caisse'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Modale : Fermeture de caisse ──────────────────────────────────────────
function FermerCaisseModal({ isOpen, onClose, onFermer, isPending }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { fondFinal: '', motifEcart: '' },
  });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit(onFermer)}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-400" /> Fermeture de caisse
        </h2>
        <div className="space-y-4">
          <div>
            <input
              type="number"
              placeholder="Fond de caisse final compté (FCFA) *"
              {...register('fondFinal', {
                required: 'Fond final requis',
                min: { value: 0, message: 'Le montant doit être positif' },
              })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
            {errors.fondFinal && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {errors.fondFinal.message}
              </p>
            )}
          </div>
          <div>
            <input
              placeholder="Motif d'écart (optionnel)"
              {...register('motifEcart')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm"
          >
            {isPending ? '⌛ Fermeture...' : '🔒 Fermer la caisse'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Page principale POS/Caisse Supermarché ────────────────────────────────
export default function POSCaissePage() {
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;
  const { tenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const [modal, setModal] = useState(null); // 'ouvrir' | 'fermer' | 'rapport'
  const [printData, setPrintData] = useState(null);
  const [rapportData, setRapportData] = useState(null);
  const [fetchingRapport, setFetchingRapport] = useState(false);

  // ── Query : session active ──────────────────────────────────
  const { data: session, isLoading, error: sessionError } = useQuery({
    queryKey: ['supermarche-caisse-session', tenantId, depotId],
    queryFn: async () => {
      const res = await supermarcheApi.getSessionCaisseActive(tenantId, depotId);
      return res.data; // null si aucune session ouverte
    },
    enabled: !!tenantId && !!depotId,
    refetchInterval: 15_000,
  });

  // ── Query : résumé caisse ───────────────────────────────────
  const { data: resume } = useQuery({
    queryKey: ['supermarche-caisse-resume', tenantId, depotId],
    queryFn: async () => {
      const res = await supermarcheApi.getResumeCaisse(tenantId, depotId);
      return res.data;
    },
    enabled: !!tenantId && !!depotId && !!session,
    refetchInterval: 30_000,
  });

  // ── Mutation : ouvrir ───────────────────────────────────────
  const ouvrirMutation = useMutation({
    mutationFn: (data) => supermarcheApi.ouvrirCaisse({
      fondInitial: parseFloat(data.fondInitial),
      depotId,
      tenantId,
      userId: user?.id || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-session'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-resume'] });
      notif.success('Caisse ouverte avec succès');
      setModal(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || "Erreur lors de l'ouverture"),
  });

  // ── Mutation : fermer ───────────────────────────────────────
  const fermerMutation = useMutation({
    mutationFn: (data) => supermarcheApi.fermerCaisse({
      sessionId: session?.id,
      fondFinal: parseFloat(data.fondFinal),
      motifEcart: data.motifEcart || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-session'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-resume'] });
      notif.success('Caisse fermée avec succès');
      setModal(null);
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Erreur lors de la fermeture'),
  });

  // ── Rapport journalier ──────────────────────────────────────
  async function handleRapport() {
    setFetchingRapport(true);
    try {
      const res = await supermarcheApi.getResumeCaisse(tenantId, depotId);
      setRapportData(res.data);
      setModal('rapport');
    } catch (err) {
      notif.error(err.response?.data?.message || 'Erreur lors du rapport');
    } finally {
      setFetchingRapport(false);
    }
  }

  // ── Impression après vente ──────────────────────────────────
  const handlePOSSuccess = async (createdVente) => {
    if (!createdVente) return;
    // Rafraîchir le résumé caisse après chaque vente
    queryClient.invalidateQueries({ queryKey: ['supermarche-caisse-resume'] });
    try {
      let tenantConfig = {};
      if (tenantId) {
        try {
          const t = await api.get(`/tenants/${tenantId}`);
          tenantConfig = t.data || {};
        } catch (_) { /* silencieux */ }
      }
      const config = {
        nomEntreprise: tenantConfig.nomEntreprise || 'SUPERMARCHÉ',
        adresse: tenantConfig.adresse || '',
        telephone: tenantConfig.telephone || '',
        messageFin: 'Merci de votre visite !',
        logo: tenantConfig.logo,
      };
      setPrintData({ vente: createdVente, config });
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintData(null), 1000);
      }, 500);
    } catch (e) {
      console.error("Erreur lors de l'impression", e);
    }
  };

  // ── Gardes ─────────────────────────────────────────────────
  if (!depotId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <Store className="w-12 h-12 mx-auto text-slate-500" />
          <p className="text-white font-bold text-lg">Aucun dépôt sélectionné</p>
          <p className="text-slate-400 text-sm">
            Sélectionnez un dépôt actif depuis le menu principal pour accéder à la caisse.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-slate-800/60 rounded-xl" />
        <div className="h-48 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="p-6 text-center text-red-400">
        Erreur de chargement de la session caisse : {sessionError.message}
      </div>
    );
  }

  const estOuverte = !!session;
  const mouvements = session?.mouvements || [];

  return (
    <div className="p-6 space-y-6">
      {/* ── En-tête ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" /> POS / Caisse
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {estOuverte ? '🟢 Caisse ouverte' : '🔴 Caisse fermée'}
            {resume && estOuverte && (
              <span className="ml-2 text-white font-bold">
                — Solde net : {(resume.soldeNet || 0).toLocaleString('fr-FR')} FCFA
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!estOuverte ? (
            <button
              onClick={() => setModal('ouvrir')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Ouvrir la caisse
            </button>
          ) : (
            <>
              <button
                onClick={() => setModal('fermer')}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Fermer la caisse
              </button>
            </>
          )}
          <button
            onClick={handleRapport}
            disabled={fetchingRapport}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {fetchingRapport ? 'Génération...' : 'Rapport journalier'}
          </button>
        </div>
      </div>

      {/* ── Résumé caisse (si ouverte) ────────────────────────── */}
      {estOuverte && resume && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'CA du jour', value: `${(resume.ventesTotal || 0).toLocaleString('fr-FR')} F`, color: 'text-emerald-400' },
            { label: 'Nb ventes', value: resume.nbVentes || 0, color: 'text-blue-400' },
            { label: 'Dépenses', value: `${(resume.depensesTotal || 0).toLocaleString('fr-FR')} F`, color: 'text-red-400' },
            { label: 'Solde net', value: `${(resume.soldeNet || 0).toLocaleString('fr-FR')} F`, color: 'text-white' },
          ].map((kpi, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Contenu principal ─────────────────────────────────── */}
      {estOuverte ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Formulaire POS */}
          <div className="lg:col-span-3">
            <POSSupermarcheForm
              metier="supermarche"
              depotId={depotId}
              onSuccess={handlePOSSuccess}
            />
          </div>
          {/* Mouvements */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              Mouvements du jour
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {mouvements.length === 0 && (
                <p className="text-xs text-slate-500 py-2 text-center">Aucun mouvement</p>
              )}
              {mouvements.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-slate-700/20 p-2 rounded-lg">
                  <span className="text-slate-300 truncate max-w-[60%]">
                    {m.type === 'ENCAISSEMENT_VENTE' ? '💰' :
                      m.type === 'FOND_INITIAL' ? '🏦' :
                      m.type === 'DECAISSEMENT_DEPENSE' ? '📤' : '📥'}{' '}
                    {m.motif || m.type}
                  </span>
                  <span className={
                    ['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'].includes(m.type)
                      ? 'text-emerald-400 font-bold'
                      : 'text-red-400 font-bold'
                  }>
                    {['FOND_INITIAL', 'ENCAISSEMENT_VENTE', 'ENCAISSEMENT_DETTE'].includes(m.type) ? '+' : '-'}
                    {(m.montant || 0).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <Lock className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <p className="text-xl font-bold text-white">La caisse est fermée</p>
          <p className="text-slate-400 mt-2">
            Vous devez ouvrir la caisse pour enregistrer des ventes.
          </p>
          <button
            onClick={() => setModal('ouvrir')}
            className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            Ouvrir la caisse maintenant
          </button>
        </div>
      )}

      {/* ── Ticket impression ─────────────────────────────────── */}
      <Receipt80mm vente={printData?.vente} config={printData?.config} />

      {/* ── Modales ──────────────────────────────────────────── */}
      <OuvrirCaisseModal
        isOpen={modal === 'ouvrir'}
        onClose={() => setModal(null)}
        onOpen={(data) => ouvrirMutation.mutate(data)}
        isPending={ouvrirMutation.isPending}
      />

      <FermerCaisseModal
        isOpen={modal === 'fermer'}
        onClose={() => setModal(null)}
        onFermer={(data) => fermerMutation.mutate(data)}
        isPending={fermerMutation.isPending}
      />

      {/* ── Rapport journalier ─────────────────────────────────── */}
      {modal === 'rapport' && rapportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Rapport journalier
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'CA total', value: `${(rapportData.ventesTotal || 0).toLocaleString('fr-FR')} F`, color: 'text-emerald-400' },
                { label: 'Nb ventes', value: rapportData.nbVentes || 0, color: 'text-blue-400' },
                { label: 'CA Cash', value: `${(rapportData.ventesCash || 0).toLocaleString('fr-FR')} F`, color: 'text-white' },
                { label: 'Orange Money', value: `${(rapportData.ventesOM || 0).toLocaleString('fr-FR')} F`, color: 'text-white' },
                { label: 'MTN MoMo', value: `${(rapportData.ventesMoMo || 0).toLocaleString('fr-FR')} F`, color: 'text-white' },
                { label: 'Dépenses', value: `${(rapportData.depensesTotal || 0).toLocaleString('fr-FR')} F`, color: 'text-red-400' },
                { label: 'Solde net', value: `${(rapportData.soldeNet || 0).toLocaleString('fr-FR')} F`, color: 'text-white font-black' },
                { label: 'Fond initial', value: `${(rapportData.fondInitial || 0).toLocaleString('fr-FR')} F`, color: 'text-slate-300' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-800 p-3 rounded-xl">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModal(null)}
              className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}