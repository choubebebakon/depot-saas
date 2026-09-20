import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import PhotoUpload from '../../../shared/components/forms/PhotoUpload';

const articleSchema = z.object({
  designation: z.string().min(2, 'La désignation doit contenir au moins 2 caractères'),
  familleId: z.string().optional(),
  prixVente: z.coerce.number().positive('Le prix de vente doit être supérieur à 0'),
  prixAchat: z.coerce.number().min(0, 'Le prix d\'achat ne peut pas être négatif').optional().or(z.literal('')),
  seuilCritique: z.coerce.number().min(0, 'Le seuil critique ne peut pas être négatif'),
  format: z.string().default('33cl'),
  estConsigne: z.boolean().default(false),
  uniteParCasier: z.coerce.number().min(1, 'Minimum 1 unité'),
  uniteParPack: z.coerce.number().min(1, 'Minimum 1 unité'),
  uniteParPalette: z.coerce.number().min(1, 'Minimum 1 unité'),
  photoUrl: z.string().nullable().optional(),
});

export default function ArticleBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { tenantId } = useAuth();
  const [familleText, setFamilleText] = useState('');

  const { data: familles } = useQuery({
    queryKey: ['depot-familles'],
    queryFn: async () => {
      const res = await api.get('/depot-boissons/familles');
      const responseData = res.data;
      if (Array.isArray(responseData)) return responseData;
      if (Array.isArray(responseData?.data)) return responseData.data;
      if (Array.isArray(responseData?.familles)) return responseData.familles;
      return [];
    },
  });

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      designation: '',
      familleId: '',
      prixVente: '',
      prixAchat: '',
      seuilCritique: 0,
      format: '33cl',
      estConsigne: false,
      uniteParCasier: 12,
      uniteParPack: 6,
      uniteParPalette: 120,
      photoUrl: null,
    }
  });

  useEffect(() => {
    if (edit) {
      const candidate = edit.famille?.nom || familles.find((f) => String(f.id) === String(edit.familleId))?.nom || '';
      setFamilleText(candidate);
      reset({
        designation: edit.designation || edit.nom || '',
        familleId: edit.familleId || '',
        prixVente: edit.prixVente || '',
        prixAchat: edit.prixAchat || '',
        seuilCritique: edit.seuilCritique || 0,
        format: edit.format || '33cl',
        estConsigne: !!edit.estConsigne,
        uniteParCasier: edit.uniteParCasier || 12,
        uniteParPack: edit.uniteParPack || 6,
        uniteParPalette: edit.uniteParPalette || 120,
        photoUrl: edit.photoUrl || null,
      });
    } else {
      setFamilleText('');
      reset({
        designation: '',
        familleId: '',
        prixVente: '',
        prixAchat: '',
        seuilCritique: 0,
        format: '33cl',
        estConsigne: false,
        uniteParCasier: 12,
        uniteParPack: 6,
        uniteParPalette: 120,
        photoUrl: null,
      });
    }
  }, [edit, isOpen, reset, familles]);

  const prefix = `/${metier}`;

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        prixAchat: data.prixAchat === '' ? null : Number(data.prixAchat),
      };

      // Famille libre : on résout le texte saisi vers une Famille existe
      // sinon on la crée à la volée (POST /catalogue/familles), puis on
      // rattache l'article via familleId (relation du modèle).
      const label = (familleText || '').trim().replace(/\s+/g, ' ');
      if (label && tenantId) {
        const existing = (Array.isArray(familles) ? familles : []).find(
          (f) => (f.nom || '').trim().toLowerCase() === label.toLowerCase(),
        );
        if (existing) {
          payload.familleId = existing.id;
        } else {
          try {
            const created = await api.post('/catalogue/familles', { nom: label, tenantId, emoji: '📦' });
            const newer = created.data?.id || created.data?.famille?.id || null;
            if (!newer) throw new Error('Création de la famille impossible.');
            payload.familleId = newer;
          } catch (err) {
            throw new Error(err?.response?.data?.message || 'Impossible d’enregistrer la famille saisie.');
          }
        }
      } else if (!label) {
        payload.familleId = '';
      }

      if (edit) {
        const r = await api.patch(`${prefix}/articles/${edit.id}`, payload);
        return r.data;
      } else {
        const r = await api.post(`${prefix}/articles`, payload);
        return r.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['depot-familles'] });
      notif.success(edit ? 'Article mis à jour' : 'Article créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || err.message || 'Une erreur est survenue');
    }
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? 'Modifier article' : 'Nouvel article boissons'} loading={mutation.isPending} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
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
            error={errors.designation?.message}
            placeholder="Ex: Bière 33cl"
          />
        )}
      />

      <Controller
        name="familleId"
        control={control}
        render={({ field }) => (
          <div>
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Famille <span className="normal-case font-medium text-slate-500">(saisie libre)</span></label>
            <input
              type="text"
              value={familleText}
              onChange={(e) => { setFamilleText(e.target.value); field.onChange(e.target.value ? '' : ''); }}
              disabled={mutation.isPending}
              list="familles-list"
              maxLength={80}
              placeholder="Saisissez ou choisissez une famille — Ex: Bières, Boissons gazeuses…"
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
            />
            <datalist id="familles-list">
              {Array.isArray(familles) && familles.map(f => (
                <option key={f.id || f._id} value={f.nom || f.libelle}>{f.emoji || ''} {f.nom || f.libelle}</option>
              ))}
            </datalist>
            <p className="text-xs text-slate-500 mt-1">Nouvelle famille créée automatiquement si elle n'est pas encore enregistrée.</p>
            {errors.familleId && <span className="text-red-400 text-xs mt-1">{errors.familleId.message}</span>}
          </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Controller
          name="format"
          control={control}
          render={({ field }) => (
            <FormField
              label="Format"
              name="format"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={['33cl', '50cl', '60cl', '65cl', '1L', '2L']}
              error={errors.format?.message}
            />
          )}
        />
        <Controller
          name="uniteParCasier"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par casier"
              name="uniteParCasier"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParCasier?.message}
            />
          )}
        />
        <Controller
          name="uniteParPack"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par pack"
              name="uniteParPack"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParPack?.message}
            />
          )}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="uniteParPalette"
          control={control}
          render={({ field }) => (
            <FormField
              label="Par palette"
              name="uniteParPalette"
              type="number"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              error={errors.uniteParPalette?.message}
            />
          )}
        />
      </div>

      <div className="mt-4">
        <PhotoUpload
          label="Photo de l'article"
          name="photoUrl"
          value={watch('photoUrl')}
          onChange={(e) => setValue('photoUrl', e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="estConsigne"
          control={control}
          render={({ field }) => (
            <FormField
              label="Consigne"
              name="estConsigne"
              type="toggle"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              toggleLabel="Cet article est consigné"
              error={errors.estConsigne?.message}
            />
          )}
        />
      </div>
    </FormModal>
  );
}