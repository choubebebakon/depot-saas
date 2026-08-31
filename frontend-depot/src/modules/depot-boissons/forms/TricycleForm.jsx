import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { depotApi } from '../services/depotApi';

const tricycleSchema = z.object({
  immatriculation: z.string().trim().min(1, 'L’immatriculation est requise').max(50, 'Immatriculation trop longue'),
  modele: z.string().trim().min(1, 'Le modèle est requis').max(100, 'Modèle trop long'),
  chauffeurId: z.string().optional(),
});

export default function TricycleForm({ isOpen, onClose, onSuccess, edit, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const depot = useDepot();
  const activeDepotId = depotId || depot?.depotId || depot?.depotActif?.id || null;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tricycleSchema),
    defaultValues: { immatriculation: '', modele: '', chauffeurId: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(edit
      ? {
          immatriculation: edit.immatriculation || edit.nom || '',
          modele: edit.modele || '',
          chauffeurId: edit.chauffeurId || '',
        }
      : { immatriculation: '', modele: '', chauffeurId: '' });
  }, [edit, isOpen, reset]);

  const { data: commerciaux = [], isLoading: commerciauxLoading } = {
    data: [],
    isLoading: false,
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      if (!activeDepotId) throw new Error('Dépôt actif requis');
      return edit
        ? depotApi.updateTricycle(edit.id, { ...data, depotId: activeDepotId, nom: data.immatriculation })
        : depotApi.createTricycle({ ...data, depotId: activeDepotId, nom: data.immatriculation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-tricycles', activeDepotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-tournees', activeDepotId] });
      notif.success(edit ? 'Tricycle modifié avec succès' : 'Tricycle créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const status = err?.response?.status;
      const message = status === 403
        ? 'Vous n’avez pas la permission de gérer les tricycles.'
        : status === 404
          ? 'Le dépôt ou le tricycle est introuvable.'
          : status === 409
            ? 'Cette immatriculation est déjà utilisée.'
            : status === 422
              ? 'Les données du tricycle sont invalides.'
              : err?.message || err?.response?.data?.message || 'Impossible d’enregistrer le tricycle.';
      notif.error(message);
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title={edit ? 'Modifier tricycle' : 'Nouveau tricycle'}
      loading={mutation.isPending}
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      {!activeDepotId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Sélectionnez d’abord un dépôt actif pour gérer un tricycle.
        </div>
      ) : (
        <div className="space-y-4">
          <Controller
            name="immatriculation"
            control={control}
            render={({ field }) => (
              <FormField label="Immatriculation" name="immatriculation" value={field.value} onChange={(e) => field.onChange(e.target.value)} required placeholder="Ex: AB-123-CD" error={errors.immatriculation?.message} />
            )}
          />
          <Controller
            name="modele"
            control={control}
            render={({ field }) => (
              <FormField label="Modèle" name="modele" value={field.value} onChange={(e) => field.onChange(e.target.value)} required placeholder="Ex: Yamaha 125cc" error={errors.modele?.message} />
            )}
          />
          <p className="text-xs text-slate-500">Le tricycle est automatiquement rattaché au dépôt actif. Le dépôt ne peut pas être changé depuis ce formulaire.</p>
        </div>
      )}
    </FormModal>
  );
}
