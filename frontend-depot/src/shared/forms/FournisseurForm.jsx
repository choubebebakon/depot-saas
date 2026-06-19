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
  nom: z.string().min(2, 'Le nom est obligatoire'),
  telephone: z.string().optional().or(z.literal('')),
  email: z.string().email('Format email invalide').optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  // Force la conversion en nombre dès la validation Zod
  soldeInitial: z.coerce.number().min(0, 'Le solde doit être positif'),
  depotId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export default function FournisseurForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
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

  // Mise à jour des valeurs lors de l'ouverture ou du changement d'édition
 useEffect(() => {
  if (isOpen) {
    if (edit) {
      // Si on modifie, on met les données existantes
      reset({
        nom: edit.nom || '',
        telephone: edit.telephone || '',
        email: edit.email || '',
        adresse: edit.adresse || '',
        soldeInitial: edit.solde || edit.soldeInitial || 0, // On accepte les deux noms
        depotId: edit.depotId || depotId || '',
        notes: edit.notes || '',
      });
    } else {
      // Si on crée, on réinitialise à vide (sauf le depotId par défaut)
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
  }
}, [isOpen, edit, depotId, reset]);

  const prefix = metier ? `/${metier}` : '';

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Conversion explicite en nombre
      const payload = { ...data, soldeInitial: Number(data.soldeInitial) };
      if (edit) {
        return (await api.patch(`${prefix}/fournisseurs/${edit.id}`, payload)).data;
      }
      return (await api.post(`${prefix}/fournisseurs`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [metier, 'fournisseurs'] });
      notif.success(edit ? 'Fournisseur mis à jour' : 'Fournisseur créé');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  });

  return (
    <FormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onSubmit={handleSubmit((d) => mutation.mutate(d))} 
      title={edit ? '✏️ Modifier le fournisseur' : '🏭 Nouveau fournisseur'} 
      loading={mutation.isPending}
    >
      <Controller
        name="nom"
        control={control}
        render={({ field }) => <FormField label="Nom" {...field} error={errors.nom?.message} required />}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => <FormField label="Téléphone" type="tel" {...field} error={errors.telephone?.message} />}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => <FormField label="Email" type="email" {...field} error={errors.email?.message} />}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="adresse"
          control={control}
          render={({ field }) => <FormField label="Adresse" {...field} error={errors.adresse?.message} />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="soldeInitial"
          control={control}
          render={({ field }) => (
            <FormField 
              label="Solde initial" 
              type="number" 
              {...field} 
              // S'assure que le changement renvoie un nombre
              onChange={(e) => field.onChange(Number(e.target.value))} 
              error={errors.soldeInitial?.message} 
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
                type="select"
                {...field}
                options={depots.map(d => ({ value: d.id, label: d.nom }))}
                error={errors.depotId?.message}
              />
            )}
          />
        )}
      </div>
    </FormModal>
  );
}