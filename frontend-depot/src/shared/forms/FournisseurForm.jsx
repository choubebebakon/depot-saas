import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { useNotif } from '../../context/NotifContext';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';

const fournisseurSchema = z.object({
  nom: z.string().min(2, 'Le nom du fournisseur est obligatoire (min 2 caractères)'),
  telephone: z.string().refine(
    val => !val || /^(\+?237)?[6][0-9]{8}$/.test(val.replace(/\s/g, '')),
    { message: 'Format attendu : 6XXXXXXXX ou 237XXXXXXXXX' }
  ).optional().or(z.literal('')),
  email: z.string().refine(
    val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Format d\'email invalide' }
  ).optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  soldeInitial: z.coerce.number().min(0, 'Le solde doit être positif ou nul'),
  depotId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export default function FournisseurForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      soldeInitial: 0,
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
        soldeInitial: edit.soldeInitial || 0,
        depotId: edit.depotId || depotId || '',
        notes: edit.notes || '',
      });
    } else {
      reset({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        soldeInitial: 0,
        depotId: depotId || '',
        notes: '',
      });
    }
  }, [edit, isOpen, depotId, reset]);

  const prefix = metier ? `/${metier}` : '';

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        soldeInitial: Number(data.soldeInitial),
        depotId: data.depotId || depotId,
      };
      if (edit) {
        const r = await api.patch(`${prefix}/fournisseurs/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/fournisseurs`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success(edit ? 'Fournisseur mis à jour' : 'Fournisseur créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(onSubmit)} title={edit ? '✏️ Modifier le fournisseur' : '🏭 Nouveau fournisseur'} loading={mutation.isPending} submitIcon={edit ? '💾' : '➕'} submitLabel={edit ? 'Modifier' : 'Créer'}>
      <Controller
        name="nom"
        control={control}
        render={({ field }) => (
          <FormField
            label="Nom"
            name="nom"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required
            error={errors.nom?.message}
            placeholder="Nom de l'entreprise ou du fournisseur"
          />
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => (
            <FormField
              label="Téléphone"
              name="telephone"
              type="tel"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.telephone?.message}
              placeholder="6XXXXXXXX"
              hint="Format camerounais"
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <FormField
              label="Email"
              name="email"
              type="email"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.email?.message}
              placeholder="fournisseur@exemple.com"
            />
          )}
        />
      </div>
      <div className="mt-4">
        <Controller
          name="adresse"
          control={control}
          render={({ field }) => (
            <FormField
              label="Adresse"
              name="adresse"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Adresse complète"
              error={errors.adresse?.message}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="soldeInitial"
          control={control}
          render={({ field }) => (
            <FormField
              label="Solde initial"
              name="soldeInitial"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              unit="FCFA"
              error={errors.soldeInitial?.message}
              hint="Solde fournisseur au démarrage"
            />
          )}
        />
        {depots.length > 0 && (
          <Controller
            name="depotId"
            control={control}
            render={({ field }) => (
              <FormField
                label="Dépôt"
                name="depotId"
                type="select"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                options={depots.map(d => ({ value: d.id, label: d.nom }))}
                error={errors.depotId?.message}
              />
            )}
          />
        )}
      </div>
      <div className="mt-4">
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <FormField
              label="Notes"
              name="notes"
              type="textarea"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              rows={2}
              placeholder="Notes optionnelles..."
              error={errors.notes?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
