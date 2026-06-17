import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const tricycleSchema = z.object({
  immatriculation: z.string().min(1, 'L\'immatriculation est requise'),
  modele: z.string().min(1, 'Le modèle est requis'),
  depotId: z.string().min(1, 'Le dépôt est requis'),
  chauffeurId: z.string().optional(),
});

export default function TricycleForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tricycleSchema),
    defaultValues: {
      immatriculation: '',
      modele: '',
      depotId: user?.depotActif?.id || '',
      chauffeurId: '',
    }
  });

  const { data: depots = [] } = useQuery({
    queryKey: ['depot-depots'],
    queryFn: async () => {
      const r = await api.get('/depot-boissons/depots');
      return r.data?.data || r.data || [];
    },
    enabled: isOpen,
  });

  const { data: commerciaux = [] } = useQuery({
    queryKey: ['commerciaux'],
    queryFn: async () => {
      const r = await api.get('/users/commerciaux');
      return r.data?.data || r.data || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (edit) {
      reset({
        immatriculation: edit.immatriculation || '',
        modele: edit.modele || '',
        depotId: edit.depotId || user?.depotActif?.id || '',
        chauffeurId: edit.chauffeurId || '',
      });
    } else {
      reset({
        immatriculation: '',
        modele: '',
        depotId: user?.depotActif?.id || '',
        chauffeurId: '',
      });
    }
  }, [edit, isOpen, user, reset]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        nom: data.immatriculation, // Use immatriculation as nom
        tenantId: user?.tenantId,
      };
      if (edit) {
        const r = await api.patch(`/tournees/tricycles/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post('/tournees/tricycles', payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricycles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      notif.success(edit ? 'Tricycle modifié avec succès' : 'Tricycle créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier tricycle' : '🚚 Nouveau tricycle'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Créer'}>
      <div className="space-y-4">
        <Controller
          name="immatriculation"
          control={control}
          render={({ field }) => (
            <FormField
              label="Immatriculation"
              name="immatriculation"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              placeholder="Ex: AB-123-CD"
              error={errors.immatriculation?.message}
            />
          )}
        />
        <Controller
          name="modele"
          control={control}
          render={({ field }) => (
            <FormField
              label="Modèle"
              name="modele"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              placeholder="Ex: Yamaha 125cc"
              error={errors.modele?.message}
            />
          )}
        />
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
              required
              error={errors.depotId?.message}
              options={depots.map(d => ({ value: d.id, label: d.nom }))}
            />
          )}
        />
        <Controller
          name="chauffeurId"
          control={control}
          render={({ field }) => (
            <FormField
              label="Chauffeur (optionnel)"
              name="chauffeurId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.chauffeurId?.message}
              options={[{ value: '', label: 'Aucun chauffeur' }, ...commerciaux.map(c => ({ value: c.id, label: c.nom || c.email }))]}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
