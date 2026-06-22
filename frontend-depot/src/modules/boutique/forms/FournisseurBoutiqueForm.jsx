import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { nom: '', contact: '', telephone: '', email: '' };

export default function FournisseurBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    if (edit) setForm({ nom: edit.nom || '', contact: edit.contact || '', telephone: edit.telephone || '', email: edit.email || '' });
    else setForm({ ...initialState });
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.nom?.trim()) errs.nom = 'Le nom est requis';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/fournisseurs/${edit.id}`, form);
      else await api.post(`${prefix}/fournisseurs`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier' : '➕ Nouveau Fournisseur'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom" name="nom" value={form.nom} onChange={set('nom')} required error={errors.nom?.message} placeholder="Nom du fournisseur" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact" name="contact" value={form.contact} onChange={set('contact')} placeholder="Personne à contacter" />
        <FormField label="Téléphone" name="telephone" value={form.telephone} onChange={set('telephone')} placeholder="+221 77 XXX XX XX" />
      </div>
      <FormField label="Email" name="email" type="email" value={form.email} onChange={set('email')} placeholder="fournisseur@email.com" />
    </FormModal>
  );
}
