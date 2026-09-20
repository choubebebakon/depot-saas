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

/**
 * Formulaire de création / édition d'un tricycle (métier Dépôt de boissons).
 * - Création  : POST /tournees/tricycles  (tenantId + depotId forcés par le scope serveur)
 * - Édition   : PATCH /tournees/tricycles/:id (uniquement si le tricycle est libre)
 * Le modèle Prisma `Tricycle` ne porte que { nom, estLibre, tenantId, depotId } :
 * l'immatriculation est stockée dans `nom` et normalisée en majuscules.
 */
const tricycleSchema = z.object({
  immatriculation: z
    .string()
    .trim()
    .min(2, 'L’immatriculation doit contenir au moins 2 caractères')
    .max(60, 'L’immatriculation ne peut pas dépasser 60 caractères')
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 .\-/]*$/,
      'Caractères autorisés : lettres, chiffres, espaces, tirets et « / »',
    ),
});

export default function TricycleForm({ isOpen, onClose, onSuccess, edit, depotId }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const depot = useDepot();
  const activeDepotId = depotId || depot?.depotId || depot?.depotActif?.id || null;
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(tricycleSchema),
    defaultValues: { immatriculation: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(edit
      ? { immatriculation: edit.immatriculation || edit.nom || '' }
      : { immatriculation: '' });
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (!activeDepotId) throw new Error('Dépôt actif requis');
      const immatriculation = data.immatriculation.trim().toUpperCase();
      // tenantId n'est volontairement JAMAIS envoyé par le client :
      // le backend l'écrase avec req.user.tenantId (anti cross-tenant).
      const payload = { nom: immatriculation, immatriculation, depotId: activeDepotId };
      return edit ? depotApi.updateTricycle(edit.id, payload) : depotApi.createTricycle(payload);
    },
    onSuccess: () => {
      // Invalidation large (prefix match) : couvre ['depot-tricycles', depotId],
      // ['tournee-workflow-options', ...] et ['tournee-workflow', ...].
      queryClient.invalidateQueries({ queryKey: ['depot-tricycles'] });
      queryClient.invalidateQueries({ queryKey: ['tournee-workflow-options'] });
      queryClient.invalidateQueries({ queryKey: ['tournee-workflow'] });
      notif.success(edit ? 'Tricycle modifié avec succès' : 'Tricycle créé avec succès');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const status = err?.response?.status;
      const message = status === 400 ? 'Données invalides : vérifiez l’immatriculation (2 à 60 caractères).'
        : status === 401 ? 'Session expirée, reconnectez-vous.'
          : status === 403 ? 'Vous n’avez pas la permission de gérer les tricycles.'
            : status === 404 ? 'Le dépôt ou le tricycle est introuvable.'
              : status === 409 ? 'Cette immatriculation est déjà utilisée ou le tricycle est en tournée.'
                : status === 422 ? 'Les données du tricycle sont invalides.'
                  : err?.code === 'ERR_NETWORK' ? 'Serveur injoignable : vérifiez votre connexion.'
                    : err?.message || err?.response?.data?.message || 'Impossible d’enregistrer le tricycle.';
      notif.error(message);
    },
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? 'Modifier tricycle' : 'Nouveau tricycle'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {!activeDepotId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">Sélectionnez d’abord un dépôt actif pour gérer un tricycle.</div>
      ) : (
        <div className="space-y-4">
          <Controller name="immatriculation" control={control} render={({ field }) => (
            <FormField
              label="Immatriculation"
              name="immatriculation"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              maxLength={60}
              placeholder="Ex: AB-123-CD"
              error={errors.immatriculation?.message}
              autoFocus
            />
          )} />
          <p className="text-xs text-slate-500">Le tricycle est automatiquement rattaché au dépôt actif (« {depot?.depotActif?.nom || activeDepotId} »). Le dépôt ne peut pas être changé depuis ce formulaire. Un tricycle en tournée ne peut pas être modifié.</p>
        </div>
      )}
    </FormModal>
  );
}
