import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { boutiqueApi } from '../services/boutiqueApi';

const articleSchema = z.object({
  designation: z.string().min(2, 'La désignation doit contenir au moins 2 caractères'),
  prixVente: z.coerce.number().positive('Le prix de vente doit être supérieur à 0'),
  prixAchat: z.coerce.number().min(0, 'Le prix d\'achat ne peut pas être négatif').optional().or(z.literal('')),
  seuilCritique: z.coerce.number().min(0, 'Le seuil critique ne peut pas être négatif'),
  codeBarres: z.string().optional(),
  unite: z.string().default('PIECE'),
  familleId: z.string().optional(),
  marqueId: z.string().optional(),
});

const defaultValues = {
  designation: '',
  prixVente: '',
  prixAchat: '',
  seuilCritique: 0,
  codeBarres: '',
  unite: 'PIECE',
  familleId: '',
  marqueId: '',
};

export default function StockBoutiqueForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  useEffect(() => {
    if (edit) {
      reset({
        designation: edit.designation || edit.nom || '',
        prixVente: edit.prixVente ?? '',
        prixAchat: edit.prixAchat ?? '',
        seuilCritique: edit.seuilCritique ?? 0,
        codeBarres: edit.codeBarres || '',
        unite: edit.unite || 'PIECE',
        familleId: edit.familleId || '',
        marqueId: edit.marqueId || '',
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
        seuilCritique: Number(data.seuilCritique),
        codeBarres: data.codeBarres || undefined,
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
      title={edit ? '✏️ Modifier' : '➕ Nouvel Article'}
      loading={mutation.isPending}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <FormField
        label="Désignation"
        name="designation"
        control={control}
        required
        error={errors.designation}
        placeholder="Nom de l'article"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Prix vente (F CFA)"
          name="prixVente"
          type="number"
          control={control}
          min="0"
          placeholder="0"
          error={errors.prixVente}
        />
        <FormField
          label="Prix achat (F CFA)"
          name="prixAchat"
          type="number"
          control={control}
          min="0"
          placeholder="0"
          error={errors.prixAchat}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Seuil critique"
          name="seuilCritique"
          type="number"
          control={control}
          min="0"
          placeholder="0"
          error={errors.seuilCritique}
        />
        <FormField
          label="Code-barres"
          name="codeBarres"
          control={control}
          placeholder="Code-barres"
          error={errors.codeBarres}
        />
      </div>
    </FormModal>
  );
}
