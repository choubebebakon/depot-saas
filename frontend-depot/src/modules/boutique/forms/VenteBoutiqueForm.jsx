import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { boutiqueApi } from '../services/boutiqueApi';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';

const panierLigneSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  designation: z.string().nullish(),
  codeBarres: z.string().nullish(),
  quantite: z.coerce.number().int().min(1, 'Minimum 1'),
  prixUnitaire: z.coerce.number().finite().min(0, 'Prix invalide'),
  remise: z.coerce.number().finite().min(0).max(100).default(0),
});

const venteSchema = z.object({
  clientId: z.string().optional().or(z.literal('')),
  depotId: z.string().optional().or(z.literal('')),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN_MOMO']),
  remiseGlobale: z.coerce.number().finite().min(0).max(100).default(0),
  montantRecu: z.coerce.number().finite().min(0).optional().or(z.literal('')),
  panier: z.array(panierLigneSchema).min(1, 'Ajoutez au moins un article au panier'),
});

const emptyValues = (depotId) => ({
  clientId: '',
  depotId: depotId || '',
  modePaiement: 'CASH',
  remiseGlobale: 0,
  montantRecu: '',
  panier: [],
});

export default function VenteBoutiqueForm({ onSuccess, depotId: depotIdProp }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { depotId: contextDepotId } = useDepot();
  const depotId = depotIdProp || contextDepotId;

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Polling fallback + real-time invalidation trigger.
  // Query keys contain "clients" / "articles" so the global useRealtimeSync
  // (which invalidates queries whose keys match resource aliases) will also
  // invalidate them when a real-time event arrives.
  useQuery({
    queryKey: ['boutique-clients', 'realtime-refresh', depotId],
    queryFn: () => boutiqueApi.getClients({ limit: 1, depotId }),
    refetchInterval: 10000,
    enabled: Boolean(depotId),
  });

  useQuery({
    queryKey: ['boutique-articles', 'realtime-refresh'],
    queryFn: () => boutiqueApi.getArticles({ limit: 1 }),
    refetchInterval: 10000,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(venteSchema),
    defaultValues: emptyValues(depotId),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'panier' });
  const modePaiement = watch('modePaiement');
  const remiseGlobale = Number(watch('remiseGlobale')) || 0;
  const montantRecu = Number(watch('montantRecu')) || 0;
  const panier = watch('panier') || [];

  useEffect(() => {
    reset(emptyValues(depotId));
  }, [depotId, reset]);

  const fetchClients = async (q) => {
    const response = await boutiqueApi.getClients({ search: q, limit: 8, depotId });
    return response.data?.data || response.data || [];
  };

  const fetchArticles = async (q) => {
    const response = await boutiqueApi.getArticles({ search: q, limit: 8 });
    return response.data?.data || response.data || [];
  };

  const ajouterAuPanier = (article) => {
    if (!article?.id) return;

    const current = getValues('panier') || [];
    const index = current.findIndex((line) => line.articleId === article.id);

    if (index >= 0) {
      setValue(
        `panier.${index}.quantite`,
        Number(current[index].quantite) + 1,
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }

    append({
      articleId: article.id,
      designation: article.designation || undefined,
      codeBarres: article.codeBarres || undefined,
      quantite: 1,
      prixUnitaire: Number(article.prixVente) || 0,
      remise: 0,
    });
  };

  const sousTotal = panier.reduce((sum, line) => {
    const quantity = Number(line.quantite) || 0;
    const price = Number(line.prixUnitaire) || 0;
    const remise = Number(line.remise) || 0;
    return sum + quantity * price * (1 - remise / 100);
  }, 0);

  const remiseMontant = sousTotal * (remiseGlobale / 100);
  const total = Math.max(0, sousTotal - remiseMontant);
  const monnaie = Math.max(0, montantRecu - total);
  const montantInsuffisant = modePaiement === 'CASH' && montantRecu < total;

  // Pré-suggestion UNE SEULE FOIS du montant reçu (le caissier le saisit
  // ensuite à la main — saisie manuelle obligatoire pour la monnaie réelle).
  useEffect(() => {
    if (modePaiement === 'CASH') {
      const current = getValues('montantRecu');
      if (current === '' || current === undefined || current === null) {
        setValue('montantRecu', total > 0 ? String(Math.round(total)) : '', { shouldDirty: true, shouldValidate: true });
      }
    }
    // Délibérément déclenché uniquement au changement de mode de paiement :
    // ne JAMAIS réécraser la saisie manuelle du caissier.
  }, [modePaiement, getValues, setValue]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) {
        throw new Error('Aucun dépôt actif sélectionné. Veuillez sélectionner un dépôt.');
      }

      if (!Array.isArray(data.panier) || data.panier.length === 0) {
        throw new Error('Le panier est vide. Ajoutez au moins un article.');
      }

      for (const line of data.panier) {
        if (!line.articleId || Number(line.quantite) <= 0 || Number(line.prixUnitaire) < 0) {
          throw new Error('Données du panier invalides. Vérifiez les articles.');
        }
      }

      if (data.modePaiement === 'CASH' && Number(data.montantRecu) < total) {
        throw new Error('Le montant reçu est inférieur au total de la vente.');
      }

      const payload = {
        depotId,
        clientId: data.clientId || undefined,
        modePaiement: data.modePaiement,
        remiseGlobale: Number(data.remiseGlobale) || 0,
        panier: data.panier.map((line) => ({
          articleId: line.articleId,
          quantite: Number(line.quantite),
          prix: Number(line.prixUnitaire),
          remise: Number(line.remise) || 0,
        })),
        total: Math.round(total * 100) / 100,
        // Ticket 80mm : montant présenté par le client et monnaie restituée
        // (recalculés côté serveur — autorité métier).
        montantRecu: data.modePaiement === 'CASH'
          ? Math.round((Number(data.montantRecu) || 0) * 100) / 100
          : Math.round(total * 100) / 100,
        monnaie: data.modePaiement === 'CASH'
          ? Math.max(0, Math.round(((Number(data.montantRecu) || 0) - total) * 100) / 100)
          : 0,
      };

      const response = await boutiqueApi.createVente(payload);
      return response.data;
    },
    onSuccess: (vente) => {
      // Invalidation large : le prédicat couvre les clés de la page Factures
      // (['boutique-factures','ventes',depotId]), du stock et du dashboard —
      // la vente apparaît en temps réel partout, complément au WebSocket.
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = Array.isArray(query.queryKey) ? query.queryKey.join('|') : String(query.queryKey || '');
          return ['boutique-', 'facture', 'vente', 'caisse', 'dashboard'].some((needle) => key.toLocaleLowerCase().includes(needle));
        },
      });
      notif.success(`Vente ${vente?.reference ? `#${vente.reference} ` : ''}enregistrée avec succès`);
      reset(emptyValues(depotId));
      setRefreshTrigger((n) => n + 1);
      onSuccess?.(vente);
    },
    onError: (error) => {
      const responseMessage = error.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage || error.message || 'Erreur lors de la vente';
      notif.error(message);
    },
  });

  const canSubmit = panier.length > 0 && total > 0 && depotId && !mutation.isPending && !montantInsuffisant;
  const submitDisabled = !canSubmit;

  const handleValiderVente = (data) => {
    if (!canSubmit) return;
    mutation.mutate(data);
  };

  // Les erreurs de validation zod ne doivent jamais être silencieuses :
  // c'était la cause d'un bouton « Valider la vente » muet.
  const onInvalidSubmit = (errs) => {
    const messages = [];
    if (errs?.panier?.message) messages.push(errs.panier.message);
    for (const key of ['modePaiement', 'remiseGlobale', 'montantRecu', 'depotId', 'clientId']) {
      if (errs?.[key]?.message) messages.push(`${key} : ${errs[key].message}`);
    }
    if (Array.isArray(errs?.panier)) {
      errs.panier.forEach((line, i) => {
        if (line && typeof line === 'object') {
          for (const field of Object.keys(line)) {
            if (line[field]?.message) messages.push(`Article ${i + 1} — ${field} : ${line[field].message}`);
          }
        }
      });
    }
    notif.error(messages[0] || 'Formulaire de vente invalide. Vérifiez le panier.');
  };

  return (
    <form onSubmit={handleSubmit(handleValiderVente, onInvalidSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6" noValidate>
      <div className="lg:col-span-2 space-y-4">
        {errors.panier?.message && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
            {errors.panier.message}
          </div>
        )}

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Ajouter un article</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutocompleteInput
              label="Article"
              placeholder="Rechercher un article..."
              fetchSuggestions={fetchArticles}
              onSelect={ajouterAuPanier}
              displayKey="designation"
              refreshKey={refreshTrigger}
            />
            <BarcodeScanner
              onScan={(code) => {
                fetchArticles(code)
                  .then((articles) => {
                    // Préférence : correspondance exacte du code-barres avant
                    // tout résultat de recherche (un scan ne doit pas retomber
                    // sur un article de désignation similaire).
                    const normalized = String(code || '').trim();
                    const exact = articles.find(
                      (a) => String(a.codeBarres ?? '').trim() === normalized,
                    );
                    const target = exact || articles[0];
                    if (target) {
                      ajouterAuPanier(target);
                    } else {
                      notif.error(`Article introuvable pour le code-barres ${code}`);
                    }
                  })
                  .catch(() => notif.error('Impossible de lire ce code-barres. Vérifiez la connexion.'))
              }}
            />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Panier ({panier.length})</h3>
          {panier.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Le panier est vide</p>
          ) : (
            <div className="space-y-2">
              {panier.map((item, index) => {
                const quantity = Number(item.quantite) || 0;
                const price = Number(item.prixUnitaire) || 0;
                const remise = Number(item.remise) || 0;
                const lineTotal = quantity * price * (1 - remise / 100);

                return (
                  <div key={item.id || `${item.articleId}-${index}`} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.designation}</p>
                      <p className="text-slate-400 text-xs">
                        {quantity} × {price.toLocaleString('fr-FR')} F
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-white font-mono font-bold">
                        {lineTotal.toLocaleString('fr-FR')} F
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                        aria-label={`Supprimer ${item.designation || 'l’article'}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Informations</h3>
          <div className="space-y-4">
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <AutocompleteInput
                  label="Client"
                  placeholder="Rechercher un client..."
                  fetchSuggestions={fetchClients}
                  value={field.value}
                  onChange={field.onChange}
                  onSelect={(client) => field.onChange(client?.id || '')}
                  displayKey="nom"
                  refreshKey={refreshTrigger}
                />
              )}
            />

            <Controller
              name="modePaiement"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Mode de paiement"
                  name="modePaiement"
                  type="select"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  options={[
                    { value: 'CASH', label: 'Espèces' },
                    { value: 'ORANGE_MONEY', label: 'Orange Money' },
                    { value: 'MTN_MOMO', label: 'MTN Mobile Money' },
                  ]}
                  error={errors.modePaiement?.message}
                />
              )}
            />

            <Controller
              name="remiseGlobale"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Remise globale (%)"
                  name="remiseGlobale"
                  type="number"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  error={errors.remiseGlobale?.message}
                />
              )}
            />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Sous-total</span>
              <span className="font-mono">{sousTotal.toLocaleString('fr-FR')} F</span>
            </div>

            {remiseMontant > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Remise</span>
                <span className="font-mono">-{remiseMontant.toLocaleString('fr-FR')} F</span>
              </div>
            )}

            <div className="flex justify-between text-white font-bold text-lg border-t border-slate-700 pt-2">
              <span>Total</span>
              <span className="font-mono text-cyan-400">{total.toLocaleString('fr-FR')} F</span>
            </div>

            {modePaiement === 'CASH' && (
              <>
                <Controller
                  name="montantRecu"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Montant reçu"
                      name="montantRecu"
                      type="number"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      min="0"
                      step="1"
                      error={errors.montantRecu?.message}
                    />
                  )}
                />
                {montantRecu > 0 && !montantInsuffisant && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Monnaie à rendre</span>
                    <span className="font-mono">{monnaie.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
                {montantInsuffisant && (
                  <p className="text-red-400 text-xs font-semibold">
                    Montant reçu insuffisant : il manque {(total - montantRecu).toLocaleString('fr-FR')} F.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitDisabled}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/20 transition-colors border border-transparent disabled:border-slate-600"
          aria-busy={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Traitement sécurisé...
            </>
          ) : (
            'Valider la vente'
          )}
        </button>
        {mutation.isError && (
          <p className="text-red-400 text-xs text-center mt-2" role="alert">
            {mutation.error?.message || 'Erreur lors de la validation'}
          </p>
        )}
      </div>
    </form>
  );
}
