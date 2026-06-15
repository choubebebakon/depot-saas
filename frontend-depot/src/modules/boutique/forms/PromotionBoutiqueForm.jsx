import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { libelle: '', type: 'REMISE', valeur: '', dateDebut: '', dateFin: '' };

export default function PromotionBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    if (edit) setForm({ libelle: edit.libelle || '', type: edit.type || 'REMISE', valeur: edit.valeur ?? '', dateDebut: edit.dateDebut?.slice(0, 10) || '', dateFin: edit.dateFin?.slice(0, 10) || '' });
    else setForm({ ...initialState });
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.libelle?.trim()) errs.libelle = 'Le libellé est requis';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/promotions/${edit.id}`, form);
      else await api.post(`${prefix}/promotions`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier' : '➕ Nouvelle Promotion'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Libellé" name="libelle" value={form.libelle} onChange={set('libelle')} required error={errors.libelle} placeholder="Libellé de la promotion" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={['REMISE', 'OFFRE_SPECIALE']} />
        <FormField label="Valeur" name="valeur" type="number" value={form.valeur} onChange={set('valeur')} min="0" placeholder="0" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date début" name="dateDebut" type="date" value={form.dateDebut} onChange={set('dateDebut')} />
        <FormField label="Date fin" name="dateFin" type="date" value={form.dateFin} onChange={set('dateFin')} />
      </div>
    </FormModal>
  );
}
