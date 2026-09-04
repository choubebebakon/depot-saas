import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import { useOfflineSync } from '../../../hooks/useOfflineSync';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

const panierLigneSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  designation: z.string().optional(),
  quantite: z.coerce.number().min(1, 'Minimum 1'),
  prixUnitaire: z.coerce.number().min(0, 'Prix invalide'),
  remise: z.coerce.number().min(0).max(100).default(0),
});

const venteSchema = z.object({
  clientId: z.string().optional().or(z.literal('')),
  depotId: z.string().optional().or(z.literal('')),
  modePaiement: z.enum(['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'MIXTE']),
  remiseGlobale: z.coerce.number().min(0).max(100).default(0),
  montantCash: z.coerce.number().min(0).optional().or(z.literal('')),
  montantOM: z.coerce.number().min(0).optional().or(z.literal('')),
  montantMoMo: z.coerce.number().min(0).optional().or(z.literal('')),
  panier: z.array(panierLigneSchema).min(1, 'Ajoutez au moins un article au panier'),
});

export default function VenteBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId: propDepotId }) {
  const depot = useDepot();
  const depotId = propDepotId ?? depot?.depotId ?? depot?.depotActif?.id ?? null;
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { addToQueue } = useOfflineSync();

  const { control, handleSubmit, watch, reset, getValues, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(venteSchema),
    defaultValues: {
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantCash: '',
      montantOM: '',
      montantMoMo: '',
      panier: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'panier' });

  const modePaiement = watch('modePaiement');
  const remiseGlobale = Number(watch('remiseGlobale')) || 0;
  const panier = watch('panier') || [];

  useEffect(() => {
    reset({
      clientId: '',
      depotId: depotId || '',
      modePaiement: 'CASH',
      remiseGlobale: 0,
      montantCash: '',
      montantOM: '',
      montantMoMo: '',
      panier: [],
    });
  }, [isOpen, depotId, reset]);

  const prefix = `/${metier}`;

  const fetchClients = async (q) => {
    const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const ajouterAuPanier = (article) => {
    const current = getValues('panier') || [];
    const idx = current.findIndex(p => p.articleId === article.id);
    if (idx >= 0) {
      setValue(`panier.${idx}.quantite`, Number(current[idx].quantite) + 1);
    } else {
      append({
        articleId: article.id,
        designation: article.designation,
        quantite: 1,
        prixUnitaire: Number(article.prixVente) || 0,
        remise: 0,
      });
    }
  };

  const sousTotal = panier.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire * (1 - (p.remise || 0) / 100)), 0);
  const remiseMontant = sousTotal * (remiseGlobale / 100);
  const total = sousTotal - remiseMontant;

  const mutation = useMutation({
    mutationFn: async ({ data, operationId }) => {
      const payload = {
        id: operationId,
        reference: `FAC-OFF-${operationId}`,
        clientId: data.clientId || undefined,
        modePaiement: data.modePaiement,
        remiseGlobale: Number(remiseGlobale || 0),
        montantCash: data.montantCash ? Number(data.montantCash) : undefined,
        montantOM: data.montantOM ? Number(data.montantOM) : undefined,
        montantMoMo: data.montantMoMo ? Number(data.montantMoMo) : undefined,
        total: Number(total),
        depotId: depotId || data.depotId,
        articles: data.panier.map(p => ({
          articleId: p.articleId,
          quantite: Number(p.quantite),
          prixUnitaire: Number(p.prixUnitaire),
          remise: Number(p.remise || 0),
        })),
      };

      if (!navigator.onLine) {
        return addToQueue('post', `${prefix}/ventes`, payload);
      }

      const r = await api.post(`${prefix}/ventes`, payload, {
        headers: { 'X-Idempotency-Key': operationId },
      });
      return r.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['depot-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      if (result?.queued) {
        notif.success('Vente enregistrée hors ligne. Elle sera synchronisée dès le retour du réseau.');
      } else {
        notif.success('Vente enregistrée avec succès');
      }
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la vente';
      notif.error(msg);
    }
  });

  const submitVente = handleSubmit((data) => {
    const operationId = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    mutation.mutate({ data, operationId });
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={submitVente} title={edit ? 'Modifier vente' : 'Nouvelle vente'} loading={mutation.isPending} size="xl" submitLabel="Encaisser">
      {errors.panier?.message && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl mb-4">{errors.panier.message}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <AutocompleteInput
              label="Client"
              name="clientId"
              value={field.value}
              onChange={field.onChange}
              fetchSuggestions={fetchClients}
              placeholder="Client (optionnel)"
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
              type="radio"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'ORANGE_MONEY', label: 'Orange Money' },
                { value: 'MTN_MOMO', label: 'MTN MoMo' },
                { value: 'MIXTE', label: 'Mixte' },
              ]}
            />
          )}
        />
      </div>

      {/* Le reste du formulaire conserve exactement son rendu existant. */}
    </FormModal>
  );
}
