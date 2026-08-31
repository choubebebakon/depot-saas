import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
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
  motif: z.string().trim().max(255, 'Motif trop long').optional().or(z.literal('')),
});

const emptyValues = {
  clientId: '',
  typeConsigneId: '',
  quantite: 1,
  estSortie: true,
  estRemboursement: false,
  motif: '',
};

export default function ConsigneForm({ isOpen, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const notif = useNotif();
  const depotContext = useDepot();
  const depotId = depotContext?.depotId || depotContext?.activeDepotId || depotContext?.depot?.id;

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(consigneSchema),
    defaultValues: emptyValues,
  });

  const estSortie = watch('estSortie');
  const estRemboursement = watch('estRemboursement');

  const { data: typesConsigne = [], isLoading: typesLoading } = useQuery({
    queryKey: ['types-consigne', depotId],
    queryFn: async () => {
      const r = await api.get('/consignes/types', {
        headers: { 'X-Depot-Id': depotId },
      });
      return r.data?.data || r.data || [];
    },
    enabled: isOpen && Boolean(depotId),
  });

  useEffect(() => {
    if (isOpen) reset(emptyValues);
  }, [isOpen, reset]);

  const fetchClients = async (q) => {
    if (!depotId) return [];
    const r = await api.get('/depot-boissons/clients', {
      params: { search: q, limit: 8, depotId },
      headers: { 'X-Depot-Id': depotId },
    });
    return r.data?.data || r.data || [];
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) throw new Error('Aucun dépôt actif');

      const headers = { 'X-Depot-Id': depotId };
      if (data.estRemboursement) {
        const r = await api.post('/consignes/rendu-sans-achat', {
          clientId: data.clientId,
          typeConsigneId: data.typeConsigneId,
          quantite: Number(data.quantite),
          estRemboursementCash: true,
        }, { headers });
        return r.data;
      }

      const r = await api.post('/consignes/mouvements', {
        clientId: data.clientId,
        typeConsigneId: data.typeConsigneId,
        quantite: Number(data.quantite),
        estSortie: data.estSortie,
        motif: data.motif || undefined,
      }, { headers });
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-consignes-client', depotId] });
      queryClient.invalidateQueries({ queryKey: ['depot-clients', depotId] });
      queryClient.invalidateQueries({ queryKey: ['types-consigne', depotId] });
      notif.success(estRemboursement ? 'Remboursement de consigne enregistré' : 'Mouvement de consigne enregistré');
      onSuccess?.();
      onClose();
      reset(emptyValues);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Impossible d’enregistrer le mouvement de consigne');
    },
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      title="Mouvement consigne"
      loading={mutation.isPending}
      submitLabel={estRemboursement ? 'Rembourser' : 'Enregistrer'}
    >
      {!depotId && <div role="alert" className="mb-4">Aucun dépôt actif sélectionné.</div>}

      <div className="mb-4">
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <AutocompleteInput
              label="Client"
              name="clientId"
              value={field.value}
              onChange={field.onChange}
              fetchSuggestions={fetchClients}
              placeholder="Rechercher un client..."
              required
              error={errors.clientId?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="typeConsigneId"
          control={control}
          render={({ field }) => (
            <FormField
              label="Type de consigne"
              name="typeConsigneId"
              type="select"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              required
              error={errors.typeConsigneId?.message}
              options={typesConsigne.map((t) => ({ value: t.id, label: t.nom || t.type }))}
            />
          )}
        />
        <Controller
          name="quantite"
          control={control}
          render={({ field }) => (
            <NumberInput
              label="Quantité"
              name="quantite"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              min={1}
              required
              error={errors.quantite?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Controller
          name="estSortie"
          control={control}
          render={({ field }) => (
            <FormField
              label="Type"
              name="estSortie"
              type="toggle"
              value={field.value}
              onChange={(e) => field.onChange(Boolean(e.target.value))}
              toggleLabel={estSortie ? 'Sortie consigne' : 'Retour consigne'}
            />
          )}
        />
        <Controller
          name="estRemboursement"
          control={control}
          render={({ field }) => (
            <FormField
              label="Remboursement"
              name="estRemboursement"
              type="toggle"
              value={field.value}
              onChange={(e) => field.onChange(Boolean(e.target.value))}
              toggleLabel="Remboursement cash"
            />
          )}
        />
      </div>

      <div className="mt-4">
        <Controller
          name="motif"
          control={control}
          render={({ field }) => (
            <FormField
              label="Motif"
              name="motif"
              type="textarea"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              rows={2}
              placeholder="Motif du mouvement..."
              error={errors.motif?.message}
            />
          )}
        />
      </div>

      {typesLoading && <div>Chargement des types de consigne…</div>}
      {mutation.isError && <div role="alert">Impossible d'enregistrer la consigne. Vérifiez vos droits et le dépôt actif.</div>}
    </FormModal>
  );
}
