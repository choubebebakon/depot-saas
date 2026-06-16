import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';

const conditionnementSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['CASIER', 'PACK', 'PALETTE', 'UNITE'], { message: 'Le type est requis' }),
  quantiteUnitaire: z.coerce.number().min(1, 'Minimum 1'),
  prixVente: z.coerce.number().positive('Le prix doit être supérieur à 0'),
  articleId: z.string().uuid('Article invalide').optional(),
});

export default function ConditionnementForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { data: articles } = useQuery({
    queryKey: ['depot-articles'],
    queryFn: async () => {
      const res = await api.get(`/${metier}/articles`);
      return res.data?.data || res.data || [];
    },
    enabled: isOpen,
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(conditionnementSchema),
    defaultValues: {
      nom: '',
      type: 'CASIER',
      quantiteUnitaire: 12,
      prixVente: '',
      articleId: '',
    }
  });

  useEffect(() => {
    if (edit) {
      reset({
        nom: edit.nom || '',
        type: edit.type || 'CASIER',
        quantiteUnitaire: edit.quantiteUnitaire || 12,
        prixVente: edit.prixVente || '',
        articleId: edit.articleId || '',
      });
    } else {
      reset({
        nom: '',
        type: 'CASIER',
        quantiteUnitaire: 12,
        prixVente: '',
        articleId: '',
      });
    }
  }, [edit, isOpen, reset]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        quantiteUnitaire: Number(data.quantiteUnitaire),
        prixVente: Number(data.prixVente),
      };
      if (edit) {
        const r = await api.patch(`${prefix}/conditionnements/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/conditionnements`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-conditionnements'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success(edit ? 'Conditionnement modifié' : 'Conditionnement créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? '✏️ Modifier conditionnement' : '📦 Nouveau conditionnement'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Créer'}>
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
            placeholder="Ex: Casier 12 bouteilles"
            error={errors.nom?.message}
          />
        )}
      />
      <Controller
        name="articleId"
        control={control}
        render={({ field }) => (
          <div className="mt-4">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Article</label>
            <select
              {...field}
              className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              <option value="">Sans article</option>
              {articles?.map(a => (
                <option key={a.id} value={a.id}>{a.designation}</option>
              ))}
            </select>
            {errors.articleId && <span className="text-red-400 text-xs mt-1">{errors.articleId.message}</span>}
          </div>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormField
              label="Type"
              name="type"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              options={[
                { value: 'CASIER', label: '📦 Casier' },
                { value: 'PACK', label: '📦 Pack' },
                { value: 'PALETTE', label: '📦 Palette' },
                { value: 'UNITE', label: '🔢 Unité' },
              ]}
              error={errors.type?.message}
            />
          )}
        />
        <Controller
          name="quantiteUnitaire"
          control={control}
          render={({ field }) => (
            <NumberInput
              label="Qté unitaire"
              name="quantiteUnitaire"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              required
              error={errors.quantiteUnitaire?.message}
            />
          )}
        />
        <Controller
          name="prixVente"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix vente"
              name="prixVente"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              unit="FCFA"
              required
              error={errors.prixVente?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}
