import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    { message: 'Format d\'email invalide' }
  ).optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  plafondCredit: z.coerce.number().min(0, 'Le plafond doit être positif ou nul'),
  depotId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export default function ClientForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
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
      depotId: depotId || '',
      notes: '',
    }
  });

  const { data: depots = [] } = useQuery({
    queryKey: ['depots', metier],
    queryFn: async () => {
      const r = await api.get(`/${metier}/depots`);
      return r.data?.data || r.data || [];
    },
    enabled: !!metier && isOpen,
  });

  useEffect(() => {
    if (edit) {
      reset({
        nom: edit.nom || '',
        telephone: edit.telephone || '',
        email: edit.email || '',
        adresse: edit.adresse || '',
        plafondCredit: edit.plafondCredit || 0,
        depotId: edit.depotId || depotId || '',
        notes: edit.notes || '',
      });
    } else {
      reset({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        plafondCredit: 0,
        depotId: depotId || '',
        notes: '',
      });
    }
  }, [edit, isOpen, depotId, reset]);

  const prefix = metier ? `/${metier}` : '';

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Nettoyage sécurisé pour Prisma
      const payload = {
        nom: data.nom,
        telephone: data.telephone || null,
        email: data.email || null,
        adresse: data.adresse || null,
        plafondCredit: Number(data.plafondCredit) || 0,
        depotId: (data.depotId && data.depotId !== "") ? data.depotId : null,
        notes: data.notes || null,
      };

      if (edit) {
        const r = await api.patch(`${prefix}/clients/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/clients`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      const clientQueryKey = metier ? [`${metier}-clients`] : ['clients'];
      queryClient.invalidateQueries({ queryKey: clientQueryKey });
      notif.success(edit ? 'Client mis à jour' : 'Client créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(mutation.mutate)} title={edit ? '✏️ Modifier le client' : '👤 Nouveau client'} loading={mutation.isPending} submitIcon={edit ? '💾' : '➕'} submitLabel={edit ? 'Modifier' : 'Créer'}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller name="plafondCredit" control={control} render={({ field }) => (
          <FormField label="Plafond crédit" name="plafondCredit" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value)} min={0} unit="FCFA" error={errors.plafondCredit?.message} />
        )} />
        {depots.length > 0 && (
          <Controller name="depotId" control={control} render={({ field }) => (
            <FormField label="Dépôt" name="depotId" type="select" value={field.value} onChange={(e) => field.onChange(e.target.value)} options={depots.map(d => ({ value: d.id, label: d.nom }))} error={errors.depotId?.message} />
          )} />
        )}
      </div>
      <div className="mt-4">
        <Controller name="notes" control={control} render={({ field }) => (
          <FormField label="Notes" name="notes" type="textarea" value={field.value} onChange={(e) => field.onChange(e.target.value)} rows={2} placeholder="Notes optionnelles..." error={errors.notes?.message} />
        )} />
      </div>
    </FormModal>
  );
}