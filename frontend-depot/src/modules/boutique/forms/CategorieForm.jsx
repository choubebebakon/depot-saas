import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';
import { boutiqueApi } from '../services/boutiqueApi';

const categorieSchema = z.object({
  nom: z.string().min(1, 'Le nom de la catégorie est requis'),
  description: z.string().optional(),
  couleur: z.string().optional(),
  icone: z.string().optional(),
  ordre: z.coerce.number().min(0, "L'ordre ne peut pas être négatif"),
  actif: z.boolean().default(true),
});

const defaultValues = {
  nom: '',
  description: '',
  couleur: '#6366f1',
  icone: '🏷️',
  ordre: 0,
  actif: true,
};

export default function CategorieForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(categorieSchema),
    defaultValues,
  });

  useEffect(() => {
    if (edit) {
      reset({
        nom: edit.nom || '',
        description: edit.description || '',
        couleur: edit.couleur || '#6366f1',
        icone: edit.icone || '🏷️',
        ordre: edit.ordre ?? 0,
        actif: edit.actif ?? true,
      });
    } else {
      reset(defaultValues);
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nom: data.nom,
        description: data.description || null,
        couleur: data.couleur || '#6366f1',
        icone: data.icone || '🏷️',
        ordre: Number(data.ordre),
        actif: data.actif ?? true,
      };
      if (edit) {
        const res = await boutiqueApi.updateCategorie(edit.id, payload);
        return res.data;
      }
      const res = await boutiqueApi.createCategorie(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-categories'] });
      queryClient.invalidateQueries({ queryKey: ['boutique-articles'] });
      notif.success(edit ? 'Catégorie mise à jour' : 'Catégorie créée avec succès');
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
      title={edit ? '✏️ Modifier catégorie' : '🏷️ Nouvelle catégorie'}
      loading={mutation.isPending}
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <Controller
        name="nom"
        control={control}
        render={({ field }) => (
          <FormField
            label="Nom de la catégorie"
            name="nom"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required
            placeholder="Ex: Parfums femme, Livres scolaires..."
            error={errors.nom?.message}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <FormField
            label="Description"
            name="description"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder="Description optionnelle..."
            error={errors.description?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Controller
          name="icone"
          control={control}
          render={({ field }) => (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Icône</label>
              <input
                type="text"
                name="icone"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="🏷️"
                className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800 text-white text-sm"
              />
            </div>
          )}
        />
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

      <Controller
        name="actif"
        control={control}
        render={({ field }) => (
          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              name="actif"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-400"
            />
            <label className="text-white text-sm">Catégorie active</label>
          </div>
        )}
      />
    </FormModal>
  );
}
