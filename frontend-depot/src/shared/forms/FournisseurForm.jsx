import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { useNotif } from '../../context/NotifContext';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';

const fournisseurSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Format email invalide').optional().or(z.literal('')),
  adresse: z.string().trim().optional().or(z.literal('')),
  soldeInitial: z.coerce.number().finite().min(0, 'Le solde doit être positif'),
  notes: z.string().trim().optional().or(z.literal('')),
});

export default function FournisseurForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const hasDepot = Boolean(depotId);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: '', telephone: '', email: '', adresse: '', soldeInitial: 0, notes: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(edit ? {
      nom: edit.nom || '',
      telephone: edit.telephone || '',
      email: edit.email || '',
      adresse: edit.adresse || '',
      soldeInitial: Number(edit.solde ?? edit.soldeInitial ?? 0),
      notes: edit.notes || '',
    } : {
      nom: '', telephone: '', email: '', adresse: '', soldeInitial: 0, notes: '',
    });
  }, [isOpen, edit, reset]);

  const onSubmit = async (data) => {
    if (!hasDepot) {
      notif.error('Aucun dépôt actif n’est disponible.');
      return;
    }

    try {
      const payload = {
        ...data,
        soldeInitial: Number(data.soldeInitial),
        depotId,
      };

      if (edit) {
        await api.patch(`/${metier}/fournisseurs/${edit.id}`, payload);
      } else {
        await api.post(`/${metier}/fournisseurs`, payload);
      }

      await queryClient.invalidateQueries({ queryKey: [metier, 'fournisseurs'] });
      await queryClient.invalidateQueries({ queryKey: [`${metier}-fournisseurs`] });
      notif.success(edit ? 'Fournisseur mis à jour' : 'Fournisseur créé');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      notif.error(
        Array.isArray(message) ? message.join(', ') :
        message ||
        (status === 403 ? 'Vous n’avez pas les droits pour cette opération.' :
         status === 404 ? 'Service fournisseur introuvable.' :
         status >= 500 ? 'Erreur serveur. Veuillez réessayer.' :
         'Erreur lors de l’enregistrement.')
      );
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title={edit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      loading={!hasDepot}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      {!hasDepot && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-xl" role="alert">
          Aucun dépôt actif n’est disponible. Sélectionnez d’abord un dépôt actif.
        </div>
      )}

      <Controller name="nom" control={control} render={({ field }) => (
        <FormField label="Nom" {...field} error={errors.nom?.message} required placeholder="Nom du fournisseur" />
      )} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller name="telephone" control={control} render={({ field }) => (
          <FormField label="Téléphone" type="tel" {...field} error={errors.telephone?.message} />
        )} />
        <Controller name="email" control={control} render={({ field }) => (
          <FormField label="Email" type="email" {...field} error={errors.email?.message} />
        )} />
      </div>

      <div className="mt-4">
        <Controller name="adresse" control={control} render={({ field }) => (
          <FormField label="Adresse" {...field} error={errors.adresse?.message} />
        )} />
      </div>

      <div className="mt-4">
        <Controller name="soldeInitial" control={control} render={({ field }) => (
          <FormField
            label="Solde initial"
            type="number"
            min="0"
            {...field}
            onChange={(e) => field.onChange(Number(e.target.value))}
            error={errors.soldeInitial?.message}
          />
        )} />
      </div>
    </FormModal>
  );
}
