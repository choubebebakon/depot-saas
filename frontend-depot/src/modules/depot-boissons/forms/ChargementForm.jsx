import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';
import { depotApi } from '../services/depotApi';

const ligneChargementSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  quantiteChargee: z.coerce.number().int().min(1, 'Minimum 1'),
  designation: z.string().optional(),
  prix: z.coerce.number().min(0).default(0),
});

const chargementSchema = z.object({
  lignes: z.array(ligneChargementSchema).min(1, 'Ajoutez au moins un article avec une quantité valide'),
});

function getErrorMessage(err) {
  const status = err?.response?.status;
  if (status === 403) return 'Vous n’avez pas accès à ce dépôt ou à cette tournée.';
  if (status === 404) return 'La tournée ou l’article est introuvable.';
  if (status === 409) return 'La tournée a changé d’état. Actualisez puis réessayez.';
  if (status === 422) return 'Les données de chargement sont invalides.';
  return err?.response?.data?.message || err?.message || 'Erreur lors du chargement.';
}

export default function ChargementForm({ isOpen, onClose, onSuccess, tourneeId, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(chargementSchema),
    defaultValues: { lignes: [{ articleId: '', quantiteChargee: 1, designation: '', prix: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' });
  const lignes = watch('lignes') || [];

  useEffect(() => {
    if (isOpen) reset({ lignes: [{ articleId: '', quantiteChargee: 1, designation: '', prix: 0 }] });
  }, [isOpen, reset]);

  const totalValeur = lignes.reduce((acc, item) => acc + Number(item.quantiteChargee || 0) * Number(item.prix || 0), 0);

  const fetchArticles = async (q) => {
    if (!depotId) return [];
    const r = await depotApi.getArticles({ search: q, limit: 8, depotId });
    return r.data?.data || r.data || [];
  };

  const updateLigneArticle = (idx, article) => {
    setValue(`lignes.${idx}.articleId`, article.id, { shouldValidate: true });
    setValue(`lignes.${idx}.designation`, article.designation || '');
    setValue(`lignes.${idx}.prix`, Number(article.prix) || Number(article.prixVente) || 0);
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      if (!depotId) throw new Error('Dépôt actif requis');
      if (!tourneeId) throw new Error('Tournée requise');
      const articles = data.lignes.filter((l) => l.articleId && Number(l.quantiteChargee) > 0).map((l) => ({ articleId: l.articleId, quantite: Number(l.quantiteChargee) }));
      return depotApi.chargerArticlesTournee(tourneeId, { articles, depotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-tricycles', depotId] });
      notif.success('Chargement enregistré avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => notif.error(getErrorMessage(err)),
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title="Chargement de tournée" loading={mutation.isPending} size="lg" submitLabel="Enregistrer le chargement">
      {!depotId || !tourneeId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">Dépôt et tournée actifs requis pour effectuer un chargement.</div>
      ) : (
        <>
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-bold uppercase">Article {idx + 1}</span>
                  {fields.length > 1 && <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕ Supprimer</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller name={`lignes.${idx}.articleId`} control={control} render={({ field: f }) => (
                    <AutocompleteInput label="Article" name={`article_${idx}`} value={f.value} onChange={f.onChange} onSelect={(article) => updateLigneArticle(idx, article)} fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher…" required error={errors.lignes?.[idx]?.articleId?.message} />
                  )} />
                  <Controller name={`lignes.${idx}.quantiteChargee`} control={control} render={({ field: f }) => (
                    <NumberInput label="Quantité" name={`qte_${idx}`} value={f.value} onChange={(e) => f.onChange(e.target.value)} min={1} required error={errors.lignes?.[idx]?.quantiteChargee?.message} />
                  )} />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => append({ articleId: '', quantiteChargee: 1, designation: '', prix: 0 })} className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white text-sm font-bold mt-3">+ Ajouter un article</button>
          {errors.lignes?.message && <p className="text-red-400 text-xs mt-2">{errors.lignes.message}</p>}
          <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between items-center mt-3"><span className="text-slate-400">Total valeur chargée</span><span className="text-white font-bold font-mono">{totalValeur.toLocaleString('fr-FR')} FCFA</span></div>
        </>
      )}
    </FormModal>
  );
}
