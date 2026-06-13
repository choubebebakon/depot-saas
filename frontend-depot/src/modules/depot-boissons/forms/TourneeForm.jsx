import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';

export default function TourneeForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      tricycleId: '',
      commercialId: '',
      depotId: depotId || '',
      date: '',
    }
  });

  const { data: tricycles = [] } = useQuery({
    queryKey: ['tricycles'],
    queryFn: async () => {
      const r = await api.get('/tournees/tricycles');
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
        tricycleId: edit.tricycleId || '',
        commercialId: edit.commercialId || '',
        depotId: edit.depotId || depotId || '',
        date: edit.date ? edit.date.slice(0, 16) : '',
      });
    } else {
      reset({
        tricycleId: '',
        commercialId: '',
        depotId: depotId || '',
        date: new Date().toISOString().slice(0, 16),
      });
    }
  }, [edit, isOpen, depotId, reset]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        depotId: data.depotId || depotId,
      };
      if (edit) {
        const r = await api.patch(`${prefix}/tournees/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/tournees`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success(edit ? 'Tournée modifiée avec succès' : 'Tournée créée avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(onSubmit)} title={edit ? '✏️ Modifier tournée' : '🚚 Nouvelle tournée'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Créer'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Controller
          name="tricycleId"
          control={control}
          rules={{ required: 'Sélectionnez un tricycle' }}
          render={({ field }) => (
            <FormField
              label="Tricycle"
              name="tricycleId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              error={errors.tricycleId?.message}
              options={tricycles.map(t => ({ value: t.id, label: `${t.immatriculation || ''} — ${t.modele || ''}` }))}
            />
          )}
        />
        <Controller
          name="commercialId"
          control={control}
          rules={{ required: 'Sélectionnez un commercial' }}
          render={({ field }) => (
            <FormField
              label="Commercial"
              name="commercialId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              error={errors.commercialId?.message}
              options={commerciaux.map(c => ({ value: c.id, label: c.nom || c.email }))}
            />
          )}
        />
      </div>
      <div className="mt-4">
        <Controller
          name="date"
          control={control}
          rules={{ required: 'La date est requise' }}
          render={({ field }) => (
            <DateTimePicker
              label="Date de la tournée"
              name="date"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              showTime
              required
              error={errors.date?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
