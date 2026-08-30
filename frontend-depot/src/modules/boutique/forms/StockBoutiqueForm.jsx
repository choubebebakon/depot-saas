import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import PhotoUpload from '../../../shared/components/forms/PhotoUpload';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import { boutiqueApi } from '../services/boutiqueApi';

const articleSchema = z.object({
  designation: z.string().min(2, 'La désignation doit contenir au moins 2 caractères'),
  prixVente: z.coerce.number().positive('Le prix de vente doit être supérieur à 0'),
  prixAchat: z.coerce.number().min(0, 'Le prix d\'achat ne peut pas être négatif').optional().or(z.literal('')),
  prixGros: z.coerce.number().min(0, 'Le prix de gros ne peut pas être négatif').optional().or(z.literal('')),
  seuilCritique: z.coerce.number().min(0, 'Le seuil critique ne peut pas être négatif'),
  codeBarres: z.string().optional(),
  unite: z.string().default('PIECE'),
  familleId: z.string().optional(),
  marqueId: z.string().optional(),
  categorieId: z.string().uuid('Catégorie invalide').optional(),
  photoUrl: z.string().nullable().optional(),
});

const defaultValues = {
  designation: '',
  prixVente: '',
  prixAchat: '',
  prixGros: '',
  seuilCritique: 0,
  codeBarres: '',
  unite: 'PIECE',
  familleId: '',
  marqueId: '',
  categorieId: '',
  photoUrl: null,
};

export default function StockBoutiqueForm({ isOpen, onClose, onSuccess, edit }) {
  const depot = useDepot();
  const depotId = depot?.depotId ?? depot?.depotActif?.id ?? null;
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { data: categories } = useQuery({
    queryKey: ['boutique-categories'],
    queryFn: async () => {
      const res = await boutiqueApi.getCategories();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  useEffect(() => {
    if (edit) {
      reset({
        designation: edit.designation || edit.nom || '',
        prixVente: edit.prixVente ?? '',
        prixAchat: edit.prixAchat ?? '',
        prixGros: edit.prixGros ?? '',
        seuilCritique: edit.seuilCritique ?? 0,
        codeBarres: edit.codeBarres || '',
        unite: edit.unite || 'PIECE',
        familleId: edit.familleId || '',
        marqueId: edit.marqueId || '',
        categorieId: edit.categorieId ?? '',
        photoUrl: edit.photoUrl || null,
      });
    } else {
      reset(defaultValues);
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        prixAchat: data.prixAchat === '' ? undefined : Number(data.prixAchat),
        prixGros: data.prixGros === '' ? undefined : Number(data.prixGros),
        seuilCritique: Number(data.seuilCritique),
        codeBarres: data.codeBarres || undefined,
        depotId,
      };

      if (edit) {
        return boutiqueApi.updateArticle(edit.id, payload);
      }
      return boutiqueApi.createArticle(payload);
    },
    onSuccess: () => {
      notif.success(edit ? 'Article modifié' : 'Article créé');
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-stock'] });
      onSuccess();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(mutation.mutate)}
      title={edit ? 'Modifier' : 'Nouvel Article'}
      loading={mutation.isPending}
      size="lg"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <Controller
        name="designation"
        control={control}
        render={({ field }) => (
          <FormField
            label="Désignation"
            name="designation"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required
            error={errors.designation?.message}
            placeholder="Nom de l'article"
          />
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Controller
          name="prixVente"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix vente"
              name="prixVente"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min="0"
              unit="FCFA"
              error={errors.prixVente?.message}
            />
          )}
        />
        <Controller
          name="prixAchat"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix achat"
              name="prixAchat"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min="0"
              unit="FCFA"
              error={errors.prixAchat?.message}
            />
          )}
        />
        <Controller
          name="prixGros"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix de gros"
              name="prixGros"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min="0"
              unit="FCFA"
              hint="Optionnel"
              error={errors.prixGros?.message}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="unite"
          control={control}
          render={({ field }) => (
            <FormField
              label="Unité"
              name="unite"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={[
                { value: 'PIECE', label: 'Pièce' },
                { value: 'KG', label: 'kg' },
                { value: 'LITRE', label: 'Litre' },
                { value: 'M2', label: 'm²' },
              ]}
            />
          )}
        />
        <Controller
          name="categorieId"
          control={control}
          render={({ field }) => (
            <FormField
              label="Catégorie"
              name="categorieId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={categories?.map(c => ({ value: c.id, label: c.nom })) || []}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Controller
          name="codeBarres"
          control={control}
          render={({ field }) => (
            <FormField
              label="Code-barres"
              name="codeBarres"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Saisir le code-barres"
              hint="Saisie manuelle ou scan direct"
              error={errors.codeBarres?.message}
            />
          )}
        />
        
        <div 
          className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 isolation-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); 
              e.stopPropagation();
            }
          }}
        >
          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
            Option alternative : Scanner / Douchette externe
          </p>
          <div className="contents">
            <BarcodeScanner
              onScan={(code) => setValue('codeBarres', code, { shouldValidate: true })}
              placeholder="Cliquez ici puis flashez l'article"
              mode="both"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="seuilCritique"
          control={control}
          render={({ field }) => (
            <FormField
              label="Seuil critique"
              name="seuilCritique"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min="0"
              error={errors.seuilCritique?.message}
            />
          )}
        />
        <div className="text-xs text-slate-500 flex items-end pb-2">
          La date de péremption se gère désormais par lot, dans Stock → Lots.
        </div>
      </div>
      <div className="mt-4">
        <PhotoUpload
          label="Photo de l'article"
          name="photoUrl"
          value={watch('photoUrl')}
          onChange={(e) => setValue('photoUrl', e.target.value)}
        />
      </div>
    </FormModal>
  );
}