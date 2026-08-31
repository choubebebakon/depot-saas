import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';

const CATEGORIES = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Téléphone', 'Internet', 'Fournitures', 'Maintenance', 'Transport', 'Publicité', 'Autre'];
const DEFAULT_VALUES = { libelle: '', montant: '', categorie: 'Loyer', date: new Date().toISOString().slice(0, 10), modePaiement: 'cash', notes: '' };

const depenseSchema = z.object({
  libelle: z.string().trim().min(1, 'Libellé requis').max(500, 'Libellé trop long'),
  montant: z.coerce.number().min(0.01, 'Le montant doit être supérieur à 0'),
  categorie: z.enum(CATEGORIES),
  date: z.string().min(1, 'Date requise'),
  modePaiement: z.enum(['cash', 'mobile_money', 'cheque', 'virement']),
  notes: z.string().max(2000, 'Notes trop longues').optional(),
});

const getErrorMessage = (error) => {
  const status = error?.response?.status;
  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (status === 403) return 'Vous n’avez pas la permission de modifier les dépenses de ce dépôt.';
  if (status === 404) return 'La dépense ou le service demandé est introuvable.';
  if (status === 422) return 'Les données de la dépense sont invalides.';
  if (status >= 500) return 'Le serveur a rencontré une erreur. Réessayez dans un instant.';
  if (!error?.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  return error?.response?.data?.message || 'Erreur lors de l’enregistrement de la dépense.';
};

export default function DepenseForm({ isOpen, onClose, onSuccess, edit, metier = 'supermarche' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { depotId } = useDepot() || {};
  const { control, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(depenseSchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (!isOpen) return;
    reset(edit ? {
      libelle: edit.libelle || edit.motif || '',
      montant: edit.montant ?? '',
      categorie: CATEGORIES.includes(edit.categorie) ? edit.categorie : 'Loyer',
      date: edit.date ? String(edit.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      modePaiement: ['cash', 'mobile_money', 'cheque', 'virement'].includes(edit.modePaiement) ? edit.modePaiement : 'cash',
      notes: edit.notes || '',
    } : DEFAULT_VALUES);
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) throw new Error('Aucun dépôt actif sélectionné.');
      const payload = { ...data, depotId, montant: Number(data.montant) };
      const res = edit ? await api.patch(`/${metier}/depenses/${edit.id}`, payload) : await api.post(`/${metier}/depenses`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-depenses', depotId] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-caisse', depotId] });
      notif.success(edit ? 'Dépense modifiée avec succès' : 'Dépense créée avec succès');
      reset(DEFAULT_VALUES);
      onSuccess?.();
      onClose();
    },
    onError: (error) => notif.error(getErrorMessage(error)),
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? 'Modifier la dépense' : 'Nouvelle dépense'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Enregistrer'}>
      <Controller name="libelle" control={control} render={({ field }) => <FormField label="Libellé" name="libelle" type="text" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.libelle?.message} />} />
      <div className="grid grid-cols-2 gap-4">
        <Controller name="montant" control={control} render={({ field }) => <FormField label="Montant (F)" name="montant" type="number" min="0.01" step="0.01" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.montant?.message} />} />
        <Controller name="date" control={control} render={({ field }) => <FormField label="Date" name="date" type="date" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.date?.message} />} />
        <Controller name="categorie" control={control} render={({ field }) => <FormField label="Catégorie" name="categorie" type="select" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.categorie?.message} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />} />
        <Controller name="modePaiement" control={control} render={({ field }) => <FormField label="Mode de paiement" name="modePaiement" type="select" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.modePaiement?.message} options={[{ value: 'cash', label: 'Cash' }, { value: 'mobile_money', label: 'Mobile Money' }, { value: 'cheque', label: 'Chèque' }, { value: 'virement', label: 'Virement' }]} />} />
      </div>
      <Controller name="notes" control={control} render={({ field }) => <FormField label="Notes" name="notes" type="textarea" value={field.value} onChange={(e) => field.onChange(e.target.value)} error={errors.notes?.message} rows={2} />} />
      {!depotId && <p className="text-sm text-red-400">Aucun dépôt actif : l’enregistrement est impossible.</p>}
    </FormModal>
  );
}
