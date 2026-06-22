import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { nom: '', telephone: '', email: '' };

export default function ClientBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    if (edit) setForm({ nom: edit.nom || '', telephone: edit.telephone || '', email: edit.email || '' });
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
      if (edit) await api.patch(`${prefix}/clients/${edit.id}`, form);
      else await api.post(`${prefix}/clients`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier' : '➕ Nouveau Client'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom" name="nom" value={form.nom} onChange={set('nom')} required error={errors.nom?.message} placeholder="Nom du client" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Téléphone" name="telephone" value={form.telephone} onChange={set('telephone')} placeholder="+221 77 XXX XX XX" />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={set('email')} placeholder="client@email.com" />
      </div>
    </FormModal>
  );
}
