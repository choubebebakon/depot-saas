import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotif } from '../../../context/NotifContext';
import { boutiqueApi } from '../services/boutiqueApi';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

// Schéma zod — valeurs affichées à l'utilisateur (VENDEUR pour l'affichage)
const personnelSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  role: z.enum(['PATRON', 'GERANT', 'VENDEUR', 'CAISSIER', 'COMPTABLE', 'MAGASINIER']),
  telephone: z.string().optional(),
});

export default function PersonnelBoutiqueForm({ isOpen, onClose, onSuccess, edit }) {
  const queryClient = useQueryClient();
  const notif = useNotif();

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      role: 'VENDEUR',
      telephone: '',
    }
  });

  useEffect(() => {
    if (edit) {
      // Au chargement en mode édition — mapper COMMERCIAL → VENDEUR
      reset({
        nom: edit.nom || '',
        prenom: edit.prenom || '',
        email: edit.email || '',
        role: edit.role === 'COMMERCIAL' ? 'VENDEUR' : (edit.role || 'VENDEUR'),
        telephone: edit.telephone || '',
      });
    } else {
      reset({
        nom: '',
        prenom: '',
        email: '',
        role: 'VENDEUR',
        telephone: '',
      });
    }
  }, [edit, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      // À la soumission — mapper VENDEUR → COMMERCIAL
      const payload = {
        ...data,
        role: data.role === 'VENDEUR' ? 'COMMERCIAL' : data.role,
      };
      if (edit) {
        return boutiqueApi.updatePersonnel(edit.id, payload);
      } else {
        return boutiqueApi.createPersonnel(payload);
      }
    },
    onSuccess: () => {
      notif.success(edit ? 'Employé modifié avec succès' : 'Employé créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['boutique-personnel'] });
      reset({
        nom: '',
        prenom: '',
        email: '',
        role: 'VENDEUR',
        telephone: '',
      });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création';
      notif.error(msg);
    }
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit(mutation.mutate)}
      title={edit ? '✏️ Modifier' : '➕ Nouvel Employé'}
      loading={mutation.isPending}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      <FormField
        label="Nom"
        name="nom"
        control={control}
        required
        error={errors.nom?.message}
        placeholder="Nom de l'employé"
      />
      <FormField
        label="Prénom"
        name="prenom"
        control={control}
        placeholder="Prénom de l'employé"
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        control={control}
        error={errors.email?.message}
        placeholder="email@exemple.com"
      />
      <FormField
        label="Poste"
        name="role"
        control={control}
        type="select"
        options={[
          { value: 'PATRON', label: 'Patron' },
          { value: 'GERANT', label: 'Gérant' },
          { value: 'VENDEUR', label: 'Vendeur' },
          { value: 'CAISSIER', label: 'Caissier' },
          { value: 'COMPTABLE', label: 'Comptable' },
          { value: 'MAGASINIER', label: 'Magasinier' },
        ]}
      />
      <FormField
        label="Téléphone"
        name="telephone"
        control={control}
        placeholder="+221 77 XXX XX XX"
      />
    </FormModal>
  );
}
