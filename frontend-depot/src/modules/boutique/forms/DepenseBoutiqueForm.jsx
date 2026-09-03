import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const depenseSchema = z.object({
  libelle: z.string().trim().min(1, 'Le libellé est requis').max(500, '500 caractères maximum'),
  montant: z.coerce.number().finite().positive('Le montant doit être positif').max(1_000_000_000, 'Montant trop élevé'),
  categorie: z.enum(['ACHATS', 'LOYER', 'ELECTRICITE', 'AUTRE']),
  notes: z.string().trim().max(500, '500 caractères maximum').optional(),
});

export default function DepenseBoutiqueForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(depenseSchema),
    defaultValues: { libelle: '', montant: '', categorie: 'ACHATS', notes: '' },
  });

  useEffect(() => {
    reset({
      libelle: edit?.libelle || edit?.motif || '',
      montant: edit?.montant || '',
      categorie: edit?.categorie || 'ACHATS',
      notes: '',
    });
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        montant: Number(data.montant),
        categorie: data.categorie,
        libelle: data.libelle.trim(),
        motif: data.notes?.trim() || data.libelle.trim(),
      };
      return edit
        ? boutiqueApi.updateDepense(edit.id, payload)
        : boutiqueApi.createDepense(payload);
    },
    onSuccess: () => {
      notif.success(edit ? 'Dépense modifiée avec succès' : 'Dépense créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['boutique-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard'] });
      reset({ libelle: '', montant: '', categorie: 'ACHATS', notes: '' });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const message = Array.isArray(err?.response?.data?.message)
        ? err.response.data.message.join(', ')
        : err?.response?.data?.message || err?.message || 'Erreur lors de l’enregistrement de la dépense';
      notif.error(message);
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title={edit ? 'Modifier la dépense' : 'Nouvelle dépense'}
      loading={mutation.isPending}
      size="md"
      submitLabel={edit ? 'Enregistrer' : 'Créer'}
    >
      <Controller
        name="libelle"
        control={control}
        render={({ field }) => (
          <FormField label="Libellé" name="libelle" value={field.value} onChange={field.onChange} required error={errors.libelle?.message} placeholder="Ex. achat de fournitures" />
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="montant"
          control={control}
          render={({ field }) => (
            <FormField label="Montant (F CFA)" name="montant" type="number" value={field.value} onChange={field.onChange} required error={errors.montant?.message} min="0.01" step="0.01" placeholder="0" />
          )}
        />
        <Controller
          name="categorie"
          control={control}
          render={({ field }) => (
            <FormField label="Catégorie" name="categorie" type="select" value={field.value} onChange={field.onChange} options={[
              { value: 'ACHATS', label: 'Achats' },
              { value: 'LOYER', label: 'Loyer' },
              { value: 'ELECTRICITE', label: 'Électricité' },
              { value: 'AUTRE', label: 'Autre' },
            ]} error={errors.categorie?.message} />
          )}
        />
      </div>
      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <FormField label="Motif / notes" name="notes" value={field.value} onChange={field.onChange} placeholder="Précision facultative" error={errors.notes?.message} />
        )}
      />
    </FormModal>
  );
}
