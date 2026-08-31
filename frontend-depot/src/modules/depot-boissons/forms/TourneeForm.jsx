import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';
import { depotApi } from '../services/depotApi';

const tourneeSchema = z.object({
  tricycleId: z.string().min(1, 'Sélectionnez un tricycle'),
  commercialId: z.string().min(1, 'Sélectionnez un commercial'),
  date: z.string().min(1, 'La date est requise'),
});

export default function TourneeForm({ isOpen, onClose, onSuccess, edit, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const depot = useDepot();
  const activeDepotId = depotId || depot?.depotId || depot?.depotActif?.id || null;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tourneeSchema),
    defaultValues: { tricycleId: '', commercialId: '', date: '' },
  });

  const { data: tricycles = [], isLoading: tricyclesLoading } = useQuery({
    queryKey: ['depot-tricycles', activeDepotId],
    queryFn: async () => {
      const r = await depotApi.getTricycles(activeDepotId);
      return r.data?.data || r.data || [];
    },
    enabled: Boolean(isOpen && activeDepotId),
  });

  const { data: commerciaux = [], isLoading: commerciauxLoading } = useQuery({
    queryKey: ['depot-commerciaux', activeDepotId],
    queryFn: async () => {
      const r = await depotApi.getCommerciaux?.(activeDepotId);
      if (!r) return [];
      return r.data?.data || r.data || [];
    },
    enabled: Boolean(isOpen && activeDepotId && depotApi.getCommerciaux),
  });

  useEffect(() => {
    if (!isOpen) return;
    if (!activeDepotId) {
      reset({ tricycleId: '', commercialId: '', date: '' });
      return;
    }
    reset(edit
      ? {
          tricycleId: edit.tricycleId || '',
          commercialId: edit.commercialId || '',
          date: edit.date ? new Date(edit.date).toISOString().slice(0, 16) : '',
        }
      : {
          tricycleId: '',
          commercialId: '',
          date: new Date().toISOString().slice(0, 16),
        });
  }, [edit, isOpen, activeDepotId, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (!activeDepotId) throw new Error('Dépôt actif requis');
      const payload = { ...data, depotId: activeDepotId };
      return edit
        ? depotApi.updateTournee(edit.id, payload)
        : depotApi.createTournee(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tournees', activeDepotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-tricycles', activeDepotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard', activeDepotId] });
      notif.success(edit ? 'Tournée modifiée avec succès' : 'Tournée créée avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const status = err?.response?.status;
      const message = status === 403
        ? 'Vous n’avez pas la permission de gérer les tournées.'
        : status === 404
          ? 'Le dépôt, le tricycle ou le commercial est introuvable.'
          : status === 422
            ? 'Les données de la tournée sont invalides.'
            : err?.message || err?.response?.data?.message || 'Impossible d’enregistrer la tournée.';
      notif.error(message);
    },
  });

  const loadingOptions = tricyclesLoading || commerciauxLoading;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title={edit ? 'Modifier tournée' : 'Nouvelle tournée'}
      loading={mutation.isPending}
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      {!activeDepotId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Sélectionnez d’abord un dépôt actif pour gérer une tournée.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="tricycleId"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Tricycle"
                  name="tricycleId"
                  type="select"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  required
                  error={errors.tricycleId?.message}
                  options={[
                    { value: '', label: loadingOptions ? 'Chargement…' : 'Sélectionner' },
                    ...tricycles.map((t) => ({
                      value: t.id,
                      label: `${t.immatriculation || t.nom || 'Sans immatriculation'}${t.modele ? ` — ${t.modele}` : ''}`,
                    })),
                  ]}
                />
              )}
            />
            <Controller
              name="commercialId"
              control={control}
              render={({ field }) => (
                <FormField
                  label="Commercial"
                  name="commercialId"
                  type="select"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  required
                  error={errors.commercialId?.message}
                  options={[
                    { value: '', label: loadingOptions ? 'Chargement…' : 'Sélectionner' },
                    ...commerciaux.map((c) => ({ value: c.id, label: c.nom || c.name || c.email })),
                  ]}
                />
              )}
            />
          </div>
          <div className="mt-4">
            <Controller
              name="date"
              control={control}
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
          <p className="mt-3 text-xs text-slate-500">
            La tournée sera automatiquement rattachée au dépôt actif. Le dépôt n’est pas modifiable depuis ce formulaire.
          </p>
        </>
      )}
    </FormModal>
  );
}
