import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
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

export default function VenteBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

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

  const isMixte = modePaiement === 'MIXTE';

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        remiseGlobale,
        panier: data.panier.map(p => ({
          articleId: p.articleId,
          quantite: p.quantite,
          prixUnitaire: p.prixUnitaire,
          remise: p.remise,
        })),
        total,
      };
      const r = await api.post(`${prefix}/ventes`, payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Vente enregistrée avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la vente';
      notif.error(msg);
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier vente' : '💰 Nouvelle vente'} loading={mutation.isPending} size="xl" submitIcon="💵" submitLabel="Encaisser">
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
                { value: 'CASH', label: '💵 Cash' },
                { value: 'ORANGE_MONEY', label: '📱 Orange Money' },
                { value: 'MTN_MOMO', label: '📱 MTN MoMo' },
                { value: 'MIXTE', label: '🔀 Mixte' },
              ]}
            />
          )}
        />
      </div>

      <div className="border-t border-slate-700/50 pt-4 mb-4">
        <h4 className="text-white font-bold text-sm mb-3">🛒 Panier</h4>
        <AutocompleteInput name="addArticle" fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." onSelect={ajouterAuPanier} />
      </div>

      {fields.length === 0 && (
        <p className="text-red-400 text-xs mb-3">⚠️ {errors.panier?.message || 'Ajoutez au moins un article au panier'}</p>
      )}

      {fields.length > 0 && (
        <div className="space-y-2 mb-4">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl">
              <span className="flex-1 text-white text-sm font-medium">{panier[idx]?.designation}</span>
              <Controller
                name={`panier.${idx}.quantite`}
                control={control}
                render={({ field: f }) => (
                  <NumberInput name={`qte_${idx}`} value={f.value} onChange={(e) => f.onChange(e.target.value)} min={1} />
                )}
              />
              <Controller
                name={`panier.${idx}.prixUnitaire`}
                control={control}
                render={({ field: f }) => (
                  <input type="number" value={f.value} onChange={(e) => f.onChange(e.target.value)}
                    className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-right font-mono" />
                )}
              />
              <Controller
                name={`panier.${idx}.remise`}
                control={control}
                render={({ field: f }) => (
                  <input type="number" value={f.value} onChange={(e) => f.onChange(e.target.value)} placeholder="%"
                    className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-right" />
                )}
              />
              <span className="text-white font-bold font-mono text-sm w-24 text-right">
                {((panier[idx]?.quantite * panier[idx]?.prixUnitaire * (1 - (panier[idx]?.remise || 0) / 100)) || 0).toLocaleString('fr-FR')} F
              </span>
              <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm">
        <div className="flex justify-between text-slate-400"><span>Sous-total</span><span>{(sousTotal || 0).toLocaleString('fr-FR')} FCFA</span></div>
        {remiseGlobale > 0 && <div className="flex justify-between text-amber-400"><span>Remise ({remiseGlobale}%)</span><span>-{remiseMontant.toLocaleString('fr-FR')} FCFA</span></div>}
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total</span><span>{(total || 0).toLocaleString('fr-FR')} FCFA</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="remiseGlobale"
          control={control}
          render={({ field }) => (
            <FormField
              label="Remise globale"
              name="remiseGlobale"
              type="number"
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={100}
              unit="%"
            />
          )}
        />
      </div>

      {isMixte && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 animate-fadeIn">
          <Controller
            name="montantCash"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant Cash"
                name="montantCash"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
          <Controller
            name="montantOM"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant Orange Money"
                name="montantOM"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
          <Controller
            name="montantMoMo"
            control={control}
            render={({ field }) => (
              <FormField
                label="Montant MTN MoMo"
                name="montantMoMo"
                type="number"
                value={field.value}
                onChange={field.onChange}
                min={0}
                unit="FCFA"
              />
            )}
          />
        </div>
      )}
    </FormModal>
  );
}
