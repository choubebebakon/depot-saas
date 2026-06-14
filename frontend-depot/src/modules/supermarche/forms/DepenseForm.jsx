import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import { useNotif } from '../../../context/NotifContext';

const CATEGORIES = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Téléphone', 'Internet', 'Fournitures', 'Maintenance', 'Transport', 'Publicité', 'Autre'];

const depenseSchema = z.object({
  libelle: z.string().min(1, 'Libellé requis'),
  montant: z.coerce.number().min(0, 'Montant invalide'),
  categorie: z.enum(CATEGORIES),
  date: z.string().min(1, 'Date requise'),
  modePaiement: z.enum(['cash', 'mobile_money', 'cheque', 'virement']),
  notes: z.string().optional(),
});

export default function DepenseForm({ isOpen, onClose, onSuccess, edit, metier = 'supermarche' }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(depenseSchema),
    defaultValues: edit || {
      libelle: '',
      montant: '',
      categorie: CATEGORIES[0],
      date: new Date().toISOString().slice(0, 10),
      modePaiement: 'cash',
      notes: '',
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (edit) {
        const res = await api.patch(`/${metier}/depenses/${edit.id}`, data);
        return res.data;
      } else {
        const res = await api.post(`/${metier}/depenses`, data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supermarche-depenses'] });
      queryClient.invalidateQueries({ queryKey: ['supermarche-dashboard'] });
      notif.success(edit ? 'Dépense modifiée avec succès' : 'Dépense créée avec succès');
      onSuccess?.();
      onClose();
      reset();
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'Échec');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit(onSubmit)} title={edit ? '✏️ Modifier la dépense' : '💰 Nouvelle dépense'} loading={mutation.isPending} submitLabel={edit ? 'Modifier' : 'Enregistrer'} submitIcon="💰">
      <FormField label="Libellé" name="libelle" type="text" control={control} error={errors.libelle} />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Montant (F)" name="montant" type="number" control={control} error={errors.montant} />
        <FormField label="Date" name="date" type="date" control={control} error={errors.date} />
        <FormField label="Catégorie" name="categorie" type="select" control={control} error={errors.categorie} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
        <FormField label="Mode de paiement" name="modePaiement" type="select" control={control} error={errors.modePaiement} options={[
          { value: 'cash', label: 'Cash' },
          { value: 'mobile_money', label: 'Mobile Money' },
          { value: 'cheque', label: 'Chèque' },
          { value: 'virement', label: 'Virement' },
        ]} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" control={control} error={errors.notes} rows={2} />
    </FormModal>
  );
}
