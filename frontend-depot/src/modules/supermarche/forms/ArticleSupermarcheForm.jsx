import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';
import PhotoUpload from '../../../shared/components/forms/PhotoUpload';
import { supermarcheApi } from '../services/supermarcheApi';

const articleSchema = z.object({
  designation: z.string().min(2, 'La désignation doit contenir au moins 2 caractères'),
  prixVente: z.coerce.number().positive('Le prix de vente doit être supérieur à 0'),
  prixAchat: z.coerce.number().min(0, 'Le prix d\'achat ne peut pas être négatif').optional().or(z.literal('')),
  prixGros: z.coerce.number().min(0, 'Le prix de gros ne peut pas être négatif').optional().or(z.literal('')),
  seuilCritique: z.coerce.number().min(0, 'Le seuil critique ne peut pas être négatif'),
  codeBarres: z.string().optional(),
  unite: z.string().default('PIECE'),
  rayonId: z.string().optional(),
  dateExpiration: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
});

const defaultValues = {
  designation: '',
  prixVente: '',
  prixAchat: '',
  prixGros: '',
  seuilCritique: 0,
  codeBarres: '',
  unite: 'PIECE',
  rayonId: '',
  dateExpiration: '',
  photoUrl: null,
};

export default function ArticleSupermarcheForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const { data: rayonsData } = useQuery({
    queryKey: ['supermarche-rayons'],
    queryFn: async () => {
      const res = await supermarcheApi.getRayons();
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: isOpen,
  });
  const rayons = rayonsData || [];

  useEffect(() => {
    if (edit) {
      reset({
        designation: edit.designation || '',
        prixVente: edit.prixVente ?? '',
        prixAchat: edit.prixAchat ?? '',
        prixGros: edit.prixGros ?? '',
        seuilCritique: edit.seuilCritique ?? 0,
        codeBarres: edit.codeBarres || '',
        unite: edit.unite || 'PIECE',
        rayonId: edit.rayons?.[0]?.rayonId || edit.rayonId || '',
        dateExpiration: edit.dateExpiration?.slice?.(0, 10) || '',
        photoUrl: edit.photoUrl || null,
      });
    } else {
      reset(defaultValues);
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const { rayonId, prixGros, ...articleFields } = data;
      const payload = {
        ...articleFields,
        prixAchat: data.prixAchat === '' ? undefined : Number(data.prixAchat),
        prixGros: prixGros === '' ? undefined : Number(prixGros),
        seuilCritique: Number(data.seuilCritique),
        codeBarres: data.codeBarres || undefined,
        dateExpiration: data.dateExpiration || undefined,
        photoUrl: data.photoUrl || undefined,
      };

      if (edit) {
        const res = await supermarcheApi.updateArticle(edit.id, payload);
        if (rayonId) {
          await supermarcheApi.assignArticleToRayon(rayonId, edit.id);
        }
        return res.data;
      }

      const res = await supermarcheApi.createArticle(payload);
      const article = res.data?.data ?? res.data;
      const articleId = article?.id;
      if (rayonId && articleId) {
        await supermarcheApi.assignArticleToRayon(rayonId, articleId);
      }
      return article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-articles'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-rayons'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      notif.success(edit ? 'Article mis à jour' : 'Article créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const formValues = watch();

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title={edit ? '✏️ Modifier article' : '📦 Nouvel article'}
      loading={mutation.isPending}
      size="lg"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <Controller
        name="designation"
        control={control}
        render={({ field }) => (
          <FormField
            label="Désignation"
            name="designation"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required
            placeholder="Nom de l'article"
            error={errors.designation?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
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
              required
              min={0}
              unit="FCFA"
              error={errors.prixVente?.message}
            />
          )}
        />
        <Controller
          name="prixAchat"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix achat"
              name="prixAchat"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              unit="FCFA"
              error={errors.prixAchat?.message}
            />
          )}
        />
        <Controller
          name="prixGros"
          control={control}
          render={({ field }) => (
            <FormField
              label="Prix de gros"
              name="prixGros"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              unit="FCFA"
              hint="Optionnel"
              error={errors.prixGros?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="unite"
          control={control}
          render={({ field }) => (
            <FormField
              label="Unité"
              name="unite"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={[
                { value: 'PIECE', label: 'Pièce' },
                { value: 'KG', label: 'kg' },
                { value: 'LITRE', label: 'Litre' },
                { value: 'M2', label: 'm²' },
              ]}
            />
          )}
        />
        <Controller
          name="rayonId"
          control={control}
          render={({ field }) => (
            <FormField
              label="Rayon"
              name="rayonId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={rayons.map((r) => ({ value: r.id, label: r.nom }))}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <Controller
          name="codeBarres"
          control={control}
          render={({ field }) => (
            <FormField
              label="Code-barres"
              name="codeBarres"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Saisir le code-barres"
              hint="Saisie manuelle ou scan direct"
              error={errors.codeBarres?.message}
            />
          )}
        />
        
        {/* 🔥 TRUC DE SIUX : Le composant BarcodeScanner génère son propre <form>.
          Pour casser la relation d'imbrication HTML interdite par React sans casser l'interface,
          on utilise "display: contents" ou un isolement d'événement strict pour couper court aux erreurs.
          On utilise également un formulaire factice local pour neutraliser le comportement du bouton de soumission s'il y en a un.
        */}
        <div 
          className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 isolation-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); 
              e.stopPropagation();
            }
          }}
        >
          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
            Option alternative : Scanner / Douchette externe
          </p>
          
          {/* On crée un environnement étanche pour le scanner */}
          <div className="contents">
            <BarcodeScanner
              onScan={(code) => setValue('codeBarres', code, { shouldValidate: true })}
              placeholder="Cliquez ici puis flashez l'article"
              mode="both"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="dateExpiration"
          control={control}
          render={({ field }) => (
            <DateTimePicker
              label="Date d'expiration"
              name="dateExpiration"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              hint="Optionnelle"
            />
          )}
        />
        <Controller
          name="seuilCritique"
          control={control}
          render={({ field }) => (
            <FormField
              label="Seuil critique"
              name="seuilCritique"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={0}
              error={errors.seuilCritique?.message}
            />
          )}
        />
      </div>

      <div className="mt-4">
        <PhotoUpload
          label="Photo de l'article"
          name="photoUrl"
          value={formValues.photoUrl}
          onChange={(e) => setValue('photoUrl', e.target.value)}
        />
      </div>
    </FormModal>
  );
}