import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useDepot } from '../../../hooks/useDepot';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

const consigneSchema = z.object({
  clientId: z.string().min(1, 'Veuillez sélectionner un client'),
  typeConsigneId: z.string().min(1, 'Veuillez sélectionner un type de consigne'),
  quantite: z.coerce.number().int().min(1, 'Minimum 1'),
  estSortie: z.boolean(),
  estRemboursement: z.boolean(),
  montantRembourse: z.coerce.number().min(0, 'Montant invalide').optional().or(z.literal('')),
  motif: z.string().trim().max(255, 'Motif trop long').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.estRemboursement) {
    const montant = data.montantRembourse === '' ? 0 : Number(data.montantRembourse);
    if (!Number.isFinite(montant) || montant <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Montant requis pour un remboursement', path: ['montantRembourse'] });
    }
  }
});

const emptyValues = {
  clientId: '', typeConsigneId: '', quantite: 1, estSortie: true,
  estRemboursement: false, montantRembourse: '', motif: '',
};

export default function ConsigneForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { user } = useAuth();
  const depotContext = useDepot();
  const depotId = depotContext?.depotId || depotContext?.activeDepotId || depotContext?.depot?.id;

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(consigneSchema), defaultValues: emptyValues,
  });

  const estSortie = watch('estSortie');
  const estRemboursement = watch('estRemboursement');

  const { data: typesConsigne = [], isLoading: typesLoading } = useQuery({
    queryKey: ['types-consigne', depotId],
    queryFn: async () => {
      const r = await api.get('/consignes/types', { params: { depotId } });
      return r.data?.data || r.data || [];
    },
    enabled: isOpen && Boolean(depotId),
  });

  useEffect(() => {
    if (edit) reset({ ...emptyValues, ...edit, quantite: edit.quantite || 1, montantRembourse: edit.montantRembourse ?? '' });
    else reset(emptyValues);
  }, [edit, isOpen, reset]);

  const prefix = `/${metier}`;
  const fetchClients = async (q) => {
    if (!depotId) return [];
    const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8, depotId } });
    return r.data?.data || r.data || [];
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) throw new Error('Aucun dépôt actif');
      const payload = { ...data, depotId, quantite: Number(data.quantite), montantRembourse: data.montantRembourse === '' ? null : Number(data.montantRembourse) };
      const r = edit
        ? await api.patch(`${prefix}/consignes/${edit.id}`, payload)
        : await api.post(`${prefix}/consignes`, payload);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-consignes', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-consignes-client', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard', depotId] });
      queryClient.invalidateQueries({ queryKey: ['types-consigne', depotId] });
      notif.success(edit ? 'Mouvement consigne mis à jour' : 'Mouvement consigne enregistré');
      onSuccess?.();
      onClose();
    },
    onError: (err) => notif.error(err.response?.data?.message || 'Une erreur est survenue'),
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit((data) => mutation.mutate(data))} title={edit ? 'Modifier mouvement consigne' : 'Mouvement consigne'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Enregistrer'}>
      {!depotId && <div role="alert" className="mb-4">Aucun dépôt actif sélectionné.</div>}
      <div className="mb-4">
        <Controller name="clientId" control={control} render={({ field }) => <AutocompleteInput label="Client" name="clientId" value={field.value} onChange={field.onChange} fetchSuggestions={fetchClients} placeholder="Rechercher un client..." required error={errors.clientId?.message} />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller name="typeConsigneId" control={control} render={({ field }) => <FormField label="Type de consigne" name="typeConsigneId" type="select" value={field.value} onChange={(e) => field.onChange(e.target.value)} required error={errors.typeConsigneId?.message} options={typesConsigne.map(t => ({ value: t.id, label: t.nom }))} />} />
        <Controller name="quantite" control={control} render={({ field }) => <NumberInput label="Quantité" name="quantite" value={field.value} onChange={(e) => field.onChange(e.target.value)} min={1} required error={errors.quantite?.message} />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller name="estSortie" control={control} render={({ field }) => <FormField label="Type" name="estSortie" type="toggle" value={field.value} onChange={(e) => field.onChange(Boolean(e.target.value))} toggleLabel={estSortie ? 'Sortie consigne' : 'Retour consigne'} />} />
        <Controller name="estRemboursement" control={control} render={({ field }) => <FormField label="Remboursement" name="estRemboursement" type="toggle" value={field.value} onChange={(e) => { const checked = Boolean(e.target.value); field.onChange(checked); if (!checked) setValue('montantRembourse', ''); }} toggleLabel="Rembourser en cash" />} />
      </div>
      {estRemboursement && <div className="mt-4"><Controller name="montantRembourse" control={control} render={({ field }) => <FormField label="Montant remboursement" name="montantRembourse" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value)} min={0} unit="FCFA" error={errors.montantRembourse?.message} />} /></div>}
      <div className="mt-4"><Controller name="motif" control={control} render={({ field }) => <FormField label="Motif" name="motif" type="textarea" value={field.value} onChange={(e) => field.onChange(e.target.value)} rows={2} placeholder="Motif du mouvement..." error={errors.motif?.message} />} /></div>
      {typesLoading && <div>Chargement des types de consigne…</div>}
      {mutation.isError && <div role="alert">Impossible d'enregistrer la consigne. Vérifiez vos droits et le dépôt actif.</div>}
    </FormModal>
  );
}
