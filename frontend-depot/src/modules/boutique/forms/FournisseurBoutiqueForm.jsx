import { useEffect, useState } from 'react';
import { z } from 'zod';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { nom: '', contact: '', telephone: '', email: '' };

const fournisseurSchema = z.object({
  nom: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  contact: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  email: z.string().trim().email('Format email invalide').optional().or(z.literal('')),
});

export default function FournisseurBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (edit) {
      setForm({
        nom: edit.nom || '',
        contact: edit.contact || '',
        telephone: edit.telephone || '',
        email: edit.email || '',
      });
    } else {
      setForm({ ...initialState });
    }
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = fournisseurSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const payload = {
        nom: result.data.nom,
        contact: result.data.contact || '',
        telephone: result.data.telephone || '',
        email: result.data.email || '',
      };

      if (edit) {
        await api.patch(`${prefix}/fournisseurs/${edit.id}`, payload);
      } else {
        await api.post(`${prefix}/fournisseurs`, payload);
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      setErrors({
        general:
          Array.isArray(message) ? message.join(', ') :
          message ||
          (status === 403 ? 'Vous n’avez pas les droits pour cette opération.' :
           status === 404 ? 'Service fournisseur introuvable.' :
           status >= 500 ? 'Erreur serveur. Veuillez réessayer.' :
           'Erreur lors de l’enregistrement.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={edit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      loading={loading}
      size="md"
      submitLabel={edit ? 'Modifier' : 'Créer'}
    >
      {errors.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl" role="alert">
          {errors.general}
        </div>
      )}

      <FormField
        label="Nom"
        name="nom"
        value={form.nom}
        onChange={set('nom')}
        required
        error={errors.nom}
        placeholder="Nom du fournisseur"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Contact"
          name="contact"
          value={form.contact}
          onChange={set('contact')}
          error={errors.contact}
          placeholder="Personne à contacter"
        />
        <FormField
          label="Téléphone"
          name="telephone"
          value={form.telephone}
          onChange={set('telephone')}
          error={errors.telephone}
          placeholder="Téléphone"
        />
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
        placeholder="fournisseur@email.com"
      />
    </FormModal>
  );
}
