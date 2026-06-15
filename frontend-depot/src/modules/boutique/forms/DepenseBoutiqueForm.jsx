import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

// Schéma zod — Depense utilise createdAt (pas de champ date)
const depenseSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis'),
  montant: z.coerce.number().positive('Le montant doit être positif'),
  categorie: z.enum(['ACHATS', 'LOYER', 'ELECTRICITE', 'AUTRE']),
  modePaiement: z.enum(['ESPECES', 'CARTE', 'CHEQUE', 'VIREMENT']).optional(),
  notes: z.string().optional(),
});

export default function DepenseBoutiqueForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(depenseSchema),
    defaultValues: {
      libelle: '',
      montant: '',
      categorie: 'ACHATS',
      modePaiement: 'ESPECES',
      notes: '',
    }
  });

  useEffect(() => {
    if (edit) {
      reset({
        libelle: edit.libelle || '',
        montant: edit.montant || '',
        categorie: edit.categorie || 'ACHATS',
        modePaiement: edit.modePaiement || 'ESPECES',
        notes: edit.notes || '',
      });
    } else {
      reset({
        libelle: '',
        montant: '',
        categorie: 'ACHATS',
        modePaiement: 'ESPECES',
        notes: '',
      });
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (edit) {
        return boutiqueApi.updateDepense(edit.id, data);
      } else {
        return boutiqueApi.createDepense(data);
      }
    },
    onSuccess: () => {
      notif.success(edit ? 'Dépense modifiée avec succès' : 'Dépense créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['boutique-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-dashboard'] });
      reset({
        libelle: '',
        montant: '',
        categorie: 'ACHATS',
        modePaiement: 'ESPECES',
        notes: '',
      });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création';
      notif.error(msg);
    }
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(mutation.mutate)}
      title={edit ? '✏️ Modifier' : '➕ Nouvelle Dépense'}
      loading={mutation.isPending}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <FormField
        label="Libellé"
        name="libelle"
        control={control}
        required
        error={errors.libelle}
        placeholder="Libellé de la dépense"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Montant (F CFA)"
          name="montant"
          type="number"
          control={control}
          required
          error={errors.montant}
          min="0"
          placeholder="0"
        />
        <FormField
          label="Catégorie"
          name="categorie"
          control={control}
          type="select"
          options={[
            { value: 'ACHATS', label: 'Achats' },
            { value: 'LOYER', label: 'Loyer' },
            { value: 'ELECTRICITE', label: 'Électricité' },
            { value: 'AUTRE', label: 'Autre' },
          ]}
        />
      </div>
      <FormField
        label="Mode de paiement"
        name="modePaiement"
        control={control}
        type="select"
        options={[
          { value: 'ESPECES', label: 'Espèces' },
          { value: 'CARTE', label: 'Carte' },
          { value: 'CHEQUE', label: 'Chèque' },
          { value: 'VIREMENT', label: 'Virement' },
        ]}
      />
      <FormField
        label="Notes"
        name="notes"
        control={control}
        placeholder="Notes optionnelles"
      />
    </FormModal>
  );
}
