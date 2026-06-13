import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { supermarcheApi } from '../services/supermarcheApi';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';

const promotionSchema = z.object({
  articleId: z.string().min(1, 'Article requis'),
  nom: z.string().min(1, 'Le nom de la promotion est requis'),
  type: z.enum(['POURCENTAGE', 'MONTANT_FIXE', 'PRIX_FIXE']),
  valeur: z.coerce.number().min(0, 'La valeur doit être >= 0'),
  dateDebut: z.string().min(1, 'La date de début est requise'),
  dateFin: z.string().min(1, 'La date de fin est requise'),
  actif: z.boolean().default(true),
});

export default function PromotionSupermarcheForm({ isOpen, onClose, onSuccess, edit, metier = 'supermarche' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const [prixOriginal, setPrixOriginal] = useState(0);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      articleId: '',
      nom: '',
      type: 'POURCENTAGE',
      valeur: '',
      dateDebut: '',
      dateFin: '',
      actif: true,
    }
  });

  const formType = watch('type');
  const formValeur = watch('valeur');

  useEffect(() => {
    if (edit) {
      reset({
        articleId: edit.articleId || '',
        nom: edit.nom || '',
        type: edit.type || 'POURCENTAGE',
        valeur: edit.valeur || '',
        dateDebut: edit.dateDebut?.slice(0, 16) || '',
        dateFin: edit.dateFin?.slice(0, 16) || '',
        actif: edit.actif ?? true,
      });
      if (edit.article) {
        setPrixOriginal(Number(edit.article.prixVente) || 0);
      }
    } else {
      reset({
        articleId: '',
        nom: '',
        type: 'POURCENTAGE',
        valeur: '',
        dateDebut: '',
        dateFin: '',
        actif: true,
      });
      setPrixOriginal(0);
    }
  }, [isOpen, edit, reset]);

  const fetchArticles = async (q) => {
    const r = await supermarcheApi.getArticles({ search: q, limit: 8 });
    return r.data?.data || r.data || [];
  };

  const handleArticleSelect = async (article) => {
    setPrixOriginal(Number(article.prixVente) || 0);
  };

  const prixPromo = formType === 'POURCENTAGE'
    ? prixOriginal * (1 - (Number(formValeur) || 0) / 100)
    : formType === 'MONTANT_FIXE'
      ? prixOriginal - (Number(formValeur) || 0)
      : formType === 'PRIX_FIXE'
        ? (Number(formValeur) || 0)
        : prixOriginal;

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (edit) {
        const r = await supermarcheApi.updatePromotion(edit.id, data);
        return r.data;
      } else {
        const r = await supermarcheApi.createPromotion(data);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      notif.success(edit ? 'Promotion modifiée avec succès' : 'Promotion créée avec succès');
      reset();
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la promotion';
      notif.error(msg);
    }
  });


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier promotion' : '🏷️ Nouvelle promotion'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Créer'}>
      <Controller
        name="articleId"
        control={control}
        render={({ field }) => (
          <AutocompleteInput label="Article" name="articleId" value={field.value} onChange={field.onChange} fetchSuggestions={fetchArticles} displayKey="designation" onSelect={(article) => { field.onChange(article.id); handleArticleSelect(article); }} placeholder="Rechercher un article..." required error={errors.articleId?.message} />
        )}
      />
      <Controller
        name="nom"
        control={control}
        render={({ field }) => (
          <FormField label="Nom de la promotion" name="nom" value={field.value} onChange={field.onChange} required placeholder="Ex: Promo semaine" error={errors.nom?.message} />
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormField label="Type" name="type" type="select" value={field.value} onChange={field.onChange} options={[
              { value: 'POURCENTAGE', label: '% Pourcentage' },
              { value: 'MONTANT_FIXE', label: '💰 Montant fixe' },
              { value: 'PRIX_FIXE', label: '🏷️ Prix fixe' },
            ]} />
          )}
        />
        <Controller
          name="valeur"
          control={control}
          render={({ field }) => (
            <FormField label="Valeur" name="valeur" type="number" value={field.value} onChange={field.onChange} required min={0} unit={formType === 'POURCENTAGE' ? '%' : 'FCFA'} error={errors.valeur?.message} />
          )}
        />
      </div>
      {prixOriginal > 0 && (
        <div className="p-3 bg-slate-800 rounded-xl text-sm space-y-1">
          <div className="flex justify-between text-slate-400"><span>Prix original</span><span>{prixOriginal.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between text-emerald-400 font-bold"><span>Prix promo</span><span>{Math.max(0, prixPromo).toLocaleString('fr-FR')} FCFA</span></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="dateDebut"
          control={control}
          render={({ field }) => (
            <DateTimePicker label="Date début" name="dateDebut" value={field.value} onChange={field.onChange} showTime required error={errors.dateDebut?.message} />
          )}
        />
        <Controller
          name="dateFin"
          control={control}
          render={({ field }) => (
            <DateTimePicker label="Date fin" name="dateFin" value={field.value} onChange={field.onChange} showTime required error={errors.dateFin?.message} />
          )}
        />
      </div>
      <Controller
        name="actif"
        control={control}
        render={({ field }) => (
          <FormField label="Activer" name="actif" type="toggle" value={field.value} onChange={field.onChange} toggleLabel={field.value ? 'Promotion active' : 'Promotion désactivée'} />
        )}
      />
    </FormModal>
  );
}
