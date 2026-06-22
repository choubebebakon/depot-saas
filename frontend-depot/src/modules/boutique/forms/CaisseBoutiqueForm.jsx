import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { libelle: '', montant: '', type: 'ENTREE', mode: 'ESPECES', notes: '' };

export default function CaisseBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (edit) setForm({ libelle: edit.libelle || '', montant: edit.montant ?? '', type: edit.type || 'ENTREE', mode: edit.mode || 'ESPECES', notes: edit.notes || '' });
    else setForm({ ...initialState });
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.libelle?.trim()) errs.libelle = 'Le libellé est requis';
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
      if (edit) await api.patch(`${prefix}/caisse/${edit.id}`, form);
      else await api.post(`${prefix}/caisse`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier' : '➕ Nouvelle Opération'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Libellé" name="libelle" value={form.libelle} onChange={set('libelle')} required error={errors.libelle?.message} placeholder="Libellé de l'opération" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Montant (F CFA)" name="montant" type="number" value={form.montant} onChange={set('montant')} required error={errors.montant?.message} min="0" placeholder="0" />
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={['ENTREE', 'SORTIE']} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mode" name="mode" type="select" value={form.mode} onChange={set('mode')} options={['ESPECES', 'ORANGE_MONEY', 'WAVE', 'CARTE']} />
        <FormField label="Notes" name="notes" value={form.notes} onChange={set('notes')} placeholder="Notes optionnelles" />
      </div>
    </FormModal>
  );
}
