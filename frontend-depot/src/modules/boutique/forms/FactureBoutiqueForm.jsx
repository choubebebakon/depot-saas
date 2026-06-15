import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { client: '', montant: '', date: '' };

export default function FactureBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    if (edit) setForm({ client: edit.client || '', montant: edit.montant ?? '', date: edit.date?.slice(0, 10) || edit.createdAt?.slice(0, 10) || '' });
    else setForm({ ...initialState });
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant est requis';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/factures/${edit.id}`, form);
      else await api.post(`${prefix}/factures`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier' : '➕ Nouvelle Facture'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Client" name="client" value={form.client} onChange={set('client')} placeholder="Nom du client" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Montant (F CFA)" name="montant" type="number" value={form.montant} onChange={set('montant')} required error={errors.montant} min="0" placeholder="0" />
        <FormField label="Date" name="date" type="date" value={form.date} onChange={set('date')} />
      </div>
    </FormModal>
  );
}
