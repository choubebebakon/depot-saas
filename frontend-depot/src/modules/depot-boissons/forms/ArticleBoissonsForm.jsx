import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const articleSchema = z.object({
  designation: z.string().min(2, 'La désignation doit contenir au moins 2 caractères'),
  prixVente: z.coerce.number().positive('Le prix de vente doit être supérieur à 0'),
  prixAchat: z.coerce.number().min(0, 'Le prix d\'achat ne peut pas être négatif').optional().or(z.literal('')),
  seuilCritique: z.coerce.number().min(0, 'Le seuil critique ne peut pas être négatif'),
  format: z.string().default('33cl'),
  estConsigne: z.boolean().default(false),
  uniteParCasier: z.coerce.number().min(1, 'Minimum 1 unité'),
  uniteParPack: z.coerce.number().min(1, 'Minimum 1 unité'),
  uniteParPalette: z.coerce.number().min(1, 'Minimum 1 unité'),
});

export default function ArticleBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      designation: '',
      prixVente: '',
      prixAchat: '',
      seuilCritique: 0,
      format: '33cl',
      estConsigne: false,
      uniteParCasier: 12,
      uniteParPack: 6,
      uniteParPalette: 120,
    }
  });

  useEffect(() => {
    if (edit) {
      reset({
        designation: edit.designation || edit.nom || '',
        prixVente: edit.prixVente || '',
        prixAchat: edit.prixAchat || '',
        seuilCritique: edit.seuilCritique || 0,
        format: edit.format || '33cl',
        estConsigne: !!edit.estConsigne,
        uniteParCasier: edit.uniteParCasier || 12,
        uniteParPack: edit.uniteParPack || 6,
        uniteParPalette: edit.uniteParPalette || 120,
      });
    } else {
      reset({
        designation: '',
        prixVente: '',
        prixAchat: '',
        seuilCritique: 0,
        format: '33cl',
        estConsigne: false,
        uniteParCasier: 12,
        uniteParPack: 6,
        uniteParPalette: 120,
      });
    }
  }, [edit, isOpen, reset]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        prixAchat: data.prixAchat === '' ? null : Number(data.prixAchat),
      };
      if (edit) {
        const r = await api.patch(`${prefix}/articles/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/articles`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success(edit ? 'Article mis à jour' : 'Article créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier article' : '🍺 Nouvel article boissons'} loading={mutation.isPending} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
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
            placeholder="Ex: Bière 33cl"
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
              required
              min={0}
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
              min={0}
              unit="FCFA"
              error={errors.prixAchat?.message}
            />
          )}
        />
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
              min={0}
              error={errors.seuilCritique?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Controller
          name="format"
          control={control}
          render={({ field }) => (
            <FormField
              label="Format"
              name="format"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={['33cl', '50cl', '60cl', '65cl', '1L', '2L']}
              error={errors.format?.message}
            />
          )}
        />
        <Controller
          name="uniteParCasier"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par casier"
              name="uniteParCasier"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParCasier?.message}
            />
          )}
        />
        <Controller
          name="uniteParPack"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par pack"
              name="uniteParPack"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParPack?.message}
            />
          )}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="uniteParPalette"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par palette"
              name="uniteParPalette"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParPalette?.message}
            />
          )}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="estConsigne"
          control={control}
          render={({ field }) => (
            <FormField
              label="Consigne"
              name="estConsigne"
              type="toggle"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              toggleLabel="Cet article est consigné"
              error={errors.estConsigne?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
