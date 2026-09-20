import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { useNotif } from '../../context/NotifContext';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';

const clientSchema = z.object({
  nom: z.string().min(2, 'Le nom du client est obligatoire (min 2 caractères)'),
  telephone: z.string().refine(
    val => !val || /^(\+?237)?[6][0-9]{8}$/.test(val.replace(/\s/g, '')),
    { message: 'Format attendu : 6XXXXXXXX ou 237XXXXXXXXX' }
  ).optional().or(z.literal('')),
  email: z.string().refine(
    val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: "Format d'email invalide" }
  ).optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  plafondCredit: z.coerce.number().min(0, 'Le plafond doit être positif ou nul'),
  // Canaux CRM : identifiants de contact Instagram / Messenger. Chaîne libre
  // (le format réel dépend du canal), bornée et validée côté backend.
  instagramId: z.string().max(64, '64 caractères maximum').optional().or(z.literal('')),
  messengerId: z.string().max(64, '64 caractères maximum').optional().or(z.literal('')),
});

export default function ClientForm({ isOpen, onClose, onSuccess, edit, metier }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      plafondCredit: 0,
      instagramId: '',
      messengerId: '',
    },
  });

  useEffect(() => {
    if (edit) {
      reset({
        nom: edit.nom || '',
        telephone: edit.telephone || '',
        email: edit.email || '',
        adresse: edit.adresse || '',
        plafondCredit: edit.plafondCredit || 0,
        instagramId: edit.instagramId || '',
        messengerId: edit.messengerId || '',
      });
    } else {
      reset({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        plafondCredit: 0,
        instagramId: '',
        messengerId: '',
      });
    }
  }, [edit, isOpen, reset]);

  const prefix = metier ? `/${metier}` : '';

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Le dépôt actif est une donnée de contexte, jamais une sélection
      // arbitraire envoyée par le formulaire. Le backend doit l'imposer.
      const payload = {
        nom: data.nom.trim(),
        telephone: data.telephone?.trim() || null,
        email: data.email?.trim() || null,
        adresse: data.adresse?.trim() || null,
        plafondCredit: Number(data.plafondCredit) || 0,
        // Canaux CRM : '' => null (effacement), cohérent avec le backend.
        instagramId: data.instagramId?.trim() || null,
        messengerId: data.messengerId?.trim() || null,
      };

      if (edit) {
        const r = await api.patch(`${prefix}/clients/${edit.id}`, payload);
        return r.data;
      }

      const r = await api.post(`${prefix}/clients`, payload);
      return r.data;
    },
    onSuccess: () => {
      if (metier) {
        queryClient.invalidateQueries({ queryKey: [`${metier}-clients`] });
        queryClient.invalidateQueries({ queryKey: [metier, 'clients'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
      notif.success(edit ? 'Client mis à jour' : 'Client créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const message = err?.response?.data?.message;
      notif.error(Array.isArray(message) ? message.join(', ') : (message || "Erreur lors de l'enregistrement"));
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(mutation.mutate)}
      title={edit ? '✏️ Modifier le client' : '👤 Nouveau client'}
      loading={mutation.isPending}
      submitIcon={edit ? '💾' : '➕'}
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <Controller name="nom" control={control} render={({ field }) => (
        <FormField label="Nom" name="nom" value={field.value} onChange={(e) => field.onChange(e.target.value)} required error={errors.nom?.message} placeholder="Nom complet du client" />
      )} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller name="telephone" control={control} render={({ field }) => (
          <FormField label="Téléphone" name="telephone" type="tel" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.telephone?.message} placeholder="6XXXXXXXX" />
        )} />
        <Controller name="email" control={control} render={({ field }) => (
          <FormField label="Email" name="email" type="email" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.email?.message} placeholder="client@exemple.com" />
        )} />
      </div>

      <div className="mt-4">
        <Controller name="adresse" control={control} render={({ field }) => (
          <FormField label="Adresse" name="adresse" value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder="Adresse complète" error={errors.adresse?.message} />
        )} />
      </div>

      <div className="mt-4">
        <Controller name="plafondCredit" control={control} render={({ field }) => (
          <FormField label="Plafond crédit" name="plafondCredit" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value)} min={0} unit="FCFA" error={errors.plafondCredit?.message} />
        )} />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Canaux de contact (CRM)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <Controller name="instagramId" control={control} render={({ field }) => (
          <FormField label="Instagram (ID ou @pseudo)" name="instagramId" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.instagramId?.message} placeholder="@client" />
        )} />
        <Controller name="messengerId" control={control} render={({ field }) => (
          <FormField label="Messenger (ID Facebook)" name="messengerId" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.messengerId?.message} placeholder="ID PSID" />
        )} />
      </div>
    </FormModal>
  );
}
