import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

const ligneChargementSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  quantiteChargee: z.coerce.number().min(1, 'Minimum 1'),
  designation: z.string().optional(),
  prix: z.coerce.number().min(0).default(0),
});

const chargementSchema = z.object({
  lignes: z.array(ligneChargementSchema)
    .min(1, 'Ajoutez au moins un article avec une quantité valide')
    .refine(
      lignes => lignes.some(l => l.articleId && l.quantiteChargee > 0),
      { message: 'Ajoutez au moins un article avec une quantité valide' },
    ),
});

export default function ChargementForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', tourneeId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(chargementSchema),
    defaultValues: {
      lignes: [{ articleId: '', quantiteChargee: 1, designation: '', prix: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' });
  const lignes = watch('lignes') || [];

  useEffect(() => {
    if (isOpen) {
      reset({ lignes: [{ articleId: '', quantiteChargee: 1, designation: '', prix: 0 }] });
    }
  }, [isOpen, reset]);

  const totalValeur = lignes.reduce((acc, i) => acc + (Number(i.quantiteChargee || 0) * Number(i.prix || 0)), 0);
  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const updateLigneArticle = (idx, article) => {
    setValue(`lignes.${idx}.articleId`, article.id);
    setValue(`lignes.${idx}.designation`, article.designation);
    setValue(`lignes.${idx}.prix`, Number(article.prix) || Number(article.prixVente) || 0);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const articlesPayload = data.lignes
        .filter(l => l.articleId && Number(l.quantiteChargee) > 0)
        .map(l => ({
          articleId: l.articleId,
          quantite: Number(l.quantiteChargee),
        }));

      const r = await api.post(`${prefix}/tournees/${tourneeId}/charger`, { articles: articlesPayload });
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Chargement enregistré avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Erreur lors du chargement';
      notif.error(msg);
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier chargement' : '📦 Chargement de tournée'} loading={mutation.isPending} size="lg" submitIcon="💾" submitLabel="Enregistrer le chargement">
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Article {idx + 1}</span>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕ Supprimer</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name={`lignes.${idx}.articleId`}
                control={control}
                render={({ field: f }) => (
                  <AutocompleteInput
                    label="Article"
                    name={`article_${idx}`}
                    value={f.value}
                    onChange={f.onChange}
                    onSelect={(article) => updateLigneArticle(idx, article)}
                    fetchSuggestions={fetchArticles}
                    displayKey="designation"
                    placeholder="Rechercher..."
                    required
                    error={errors.lignes?.[idx]?.articleId?.message}
                  />
                )}
              />
              <Controller
                name={`lignes.${idx}.quantiteChargee`}
                control={control}
                render={({ field: f }) => (
                  <NumberInput
                    label="Quantité"
                    name={`qte_${idx}`}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    min={1}
                    required
                    error={errors.lignes?.[idx]?.quantiteChargee?.message}
                  />
                )}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => append({ articleId: '', quantiteChargee: 1, designation: '', prix: 0 })}
        className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 text-sm font-bold transition-all mt-3">
        + Ajouter un article
      </button>
      {errors.lignes?.message && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes.message}</p>}
      {errors.lignes?.root?.message && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes.root.message}</p>}
      <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between items-center mt-3">
        <span className="text-slate-400">Total valeur chargée</span>
        <span className="text-white font-bold font-mono">{totalValeur.toLocaleString('fr-FR')} FCFA</span>
      </div>
    </FormModal>
  );
}
