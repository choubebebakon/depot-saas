import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import { useNotif } from '../../../context/NotifContext';
import { useDepot } from '../../../contexts/DepotContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

const consigneSchema = z.object({
  clientId: z.string().min(1, 'Veuillez sélectionner un client'),
  typeConsigneText: z.string().min(1, 'Veuillez saisir un type de consigne'),
  quantite: z.coerce.number().int().min(1, 'Minimum 1'),
  estSortie: z.boolean(),
  estRemboursement: z.boolean(),
  motif: z.string().trim().max(255, 'Motif trop long').optional().or(z.literal('')),
});

const emptyValues = {
  clientId: '',
  typeConsigneText: '',
  quantite: 1,
  estSortie: true,
  estRemboursement: false,
  motif: '',
};

// Types de consigne standards reconnus par le backend (enum TypeConsigne).
const TYPE_ALIASES = [
  { type: 'BOUTEILLE_33CL', label: 'Bouteille 33cl' },
  { type: 'BOUTEILLE_60CL', label: 'Bouteille 60cl' },
  { type: 'CASIER', label: 'Casier' },
  { type: 'PALETTE', label: 'Palette' },
  { type: 'PACK_EAU', label: 'Pack eau' },
];
const labelForType = (type) => String(type || '')
  .toLowerCase()
  .split('_')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');
const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

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
    if (isOpen) { reset(emptyValues); }
  }, [isOpen, reset]);

  const fetchClients = async (q) => {
    if (!depotId) return [];
    const r = await api.get('/depot-boissons/clients', {
      params: { search: q, limit: 8, depotId },
      headers: { 'X-Depot-Id': depotId },
    });
    return r.data?.data || r.data || [];
  };

  // Résout le type de consigne saisi librement vers une config existante
  // (ou la crée pour PATRON/GERANT) afin de fournir un typeConsigneId au backend.
  const resolveTypeConsigneId = async (textInput) => {
    const text = normalize(textInput);
    if (!text) throw new Error('Saisissez le type de consigne (ex : Bouteille 33cl).');

    const existing = (Array.isArray(typesConsigne) ? typesConsigne : []).find(
      (t) => normalize(labelForType(t.type)) === text || normalize(t.type) === text,
    );
    if (existing) return existing.id;

    const alias = TYPE_ALIASES.find((t) => normalize(t.label) === text);
    if (!alias) {
      throw new Error(`Type de consigne inconnu. Utilisez : ${TYPE_ALIASES.map((t) => t.label).join(', ')}.`);
    }

    try {
      const created = await api.post('/consignes/types', {
        type: alias.type,
        valeurXAF: 0,
        description: textInput.trim(),
      }, { headers: { 'X-Depot-Id': depotId } });
      const id = created.data?.id || created.data?.data?.id;
      if (!id) throw new Error('Création du type de consigne impossible.');
      return id;
    } catch (err) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        throw new Error(`Le type « ${textInput.trim()} » doit d'abord être créé par le Patron ou le Gérant.`);
      }
      throw new Error(err?.response?.data?.message || 'Impossible d\'enregistrer ce type de consigne.');
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (!depotId) throw new Error('Aucun dépôt actif');
      const typeConsigneId = await resolveTypeConsigneId(data.typeConsigneText);

      const headers = { 'X-Depot-Id': depotId };
      if (data.estRemboursement) {
        const r = await api.post('/consignes/rendu-sans-achat', {
          clientId: data.clientId,
          typeConsigneId,
          quantite: Number(data.quantite),
          estRemboursementCash: true,
        }, { headers });
        return r.data;
      }

      const r = await api.post('/consignes/mouvements', {
        clientId: data.clientId,
        typeConsigneId,
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
          name="typeConsigneText"
          control={control}
          render={({ field }) => (
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Type de consigne <span className="normal-case font-medium text-slate-500">(saisie libre)</span></label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => { field.onChange(e.target.value); }}
                list="types-consigne-list"
                maxLength={80}
                placeholder="Ex: Bouteille 33cl, Casier, Palette…"
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 text-white rounded-xl px-4 py-3 text-sm outline-none"
              />
              <datalist id="types-consigne-list">
                {(typesConsigne.length ? typesConsigne : TYPE_ALIASES).map((t) => (
                  <option key={t.id || t.type} value={labelForType(t.type)} />
                ))}
              </datalist>
              {errors.typeConsigneText && <span className="text-red-400 text-xs mt-1">{errors.typeConsigneText.message}</span>}
            </div>
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
