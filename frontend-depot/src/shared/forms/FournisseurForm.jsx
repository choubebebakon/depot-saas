import { useState, useEffect } from 'react';
import api from '../../api';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';

export default function FournisseurForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', soldeInitial: 0, depotId: depotId || '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [depots, setDepots] = useState([]);

  useEffect(() => {
    if (edit) setForm({ nom: edit.nom || '', telephone: edit.telephone || '', email: edit.email || '', adresse: edit.adresse || '', soldeInitial: edit.soldeInitial || 0, depotId: edit.depotId || '', notes: edit.notes || '' });
    else setForm({ nom: '', telephone: '', email: '', adresse: '', soldeInitial: 0, depotId: depotId || '', notes: '' });
  }, [edit, isOpen, depotId]);

  useEffect(() => {
    api.get(`/${metier}/depots`).then(r => setDepots(r.data?.data || r.data || [])).catch(() => {});
  }, [metier]);

  const prefix = metier ? `/${metier}` : '';
  const validate = () => {
    const errs = {};
    if (!form.nom || form.nom.length < 2) errs.nom = 'Le nom du fournisseur est obligatoire (min 2 caractères)';
    if (form.telephone && !/^(\+?237)?[6][0-9]{8}$/.test(form.telephone.replace(/\s/g, ''))) errs.telephone = 'Format attendu : 6XXXXXXXX ou 237XXXXXXXXX';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format d\'email invalide';
    if (form.soldeInitial < 0) errs.soldeInitial = 'Le solde doit être positif ou nul';
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
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier le fournisseur' : '🏭 Nouveau fournisseur'} loading={loading} submitIcon={edit ? '💾' : '➕'} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom" name="nom" value={form.nom} onChange={set('nom')} required error={errors.nom} placeholder="Nom de l'entreprise ou du fournisseur" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={set('telephone')} error={errors.telephone} placeholder="6XXXXXXXX" hint="Format camerounais" />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="fournisseur@exemple.com" />
      </div>
      <FormField label="Adresse" name="adresse" value={form.adresse} onChange={set('adresse')} placeholder="Adresse complète" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Solde initial" name="soldeInitial" type="number" value={form.soldeInitial} onChange={set('soldeInitial')} min={0} unit="FCFA" error={errors.soldeInitial} hint="Solde fournisseur au démarrage" />
        {depots.length > 0 && <FormField label="Dépôt" name="depotId" type="select" value={form.depotId} onChange={set('depotId')} options={depots.map(d => ({ value: d.id, label: d.nom }))} />}
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} placeholder="Notes optionnelles..." />
    </FormModal>
  );
}
