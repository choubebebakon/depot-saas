import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';
import { supermarcheApi } from '../services/supermarcheApi';

const rayonSchema = z.object({
  nom: z.string().min(1, 'Le nom du rayon est requis'),
  couleur: z.string().optional(),
  ordre: z.coerce.number().min(0, 'L\'ordre ne peut pas être négatif'),
});

const defaultValues = {
  nom: '',
  couleur: '#6366f1',
  ordre: 0,
};

export default function RayonForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(rayonSchema),
    defaultValues,
  });

  useEffect(() => {
    if (edit) {
      reset({
        nom: edit.nom || '',
        couleur: edit.couleur || '#6366f1',
        ordre: edit.ordre ?? 0,
      });
    } else {
      reset(defaultValues);
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nom: data.nom,
        couleur: data.couleur || '#6366f1',
        ordre: Number(data.ordre),
      };
      if (edit) {
        const res = await supermarcheApi.updateRayon(edit.id, payload);
        return res.data;
      }
      const res = await supermarcheApi.createRayon(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-rayons'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      notif.success(edit ? 'Rayon mis à jour' : 'Rayon créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title={edit ? '✏️ Modifier rayon' : '🏪 Nouveau rayon'}
      loading={mutation.isPending}
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <Controller
        name="nom"
        control={control}
        render={({ field }) => (
          <FormField
            label="Nom du rayon"
            name="nom"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required
            placeholder="Ex: Boissons, Produits laitiers..."
            error={errors.nom?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="couleur"
          control={control}
          render={({ field }) => (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Couleur</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="couleur"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-12 h-12 rounded-xl border border-slate-600 bg-slate-800 cursor-pointer"
                />
                <span className="text-white text-sm font-mono">{field.value}</span>
              </div>
            </div>
          )}
        />
        <Controller
          name="ordre"
          control={control}
          render={({ field }) => (
            <NumberInput
              label="Ordre d'affichage"
              name="ordre"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              error={errors.ordre?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
