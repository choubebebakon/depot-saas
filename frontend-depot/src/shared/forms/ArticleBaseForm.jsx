import { useState, useEffect } from 'react';
import api from '../../api';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';

export default function ArticleBaseForm({ isOpen, onClose, onSuccess, edit, metier, extraFields, title }) {
  const [form, setForm] = useState({ designation: '', prixVente: '', prixAchat: '', seuilCritique: 0, familleId: '', marqueId: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [familles, setFamilles] = useState([]);
  const [marques, setMarques] = useState([]);

  useEffect(() => {
    if (edit) setForm({ designation: edit.designation || edit.nom || '', prixVente: edit.prixVente || '', prixAchat: edit.prixAchat || '', seuilCritique: edit.seuilCritique || 0, familleId: edit.familleId || '', marqueId: edit.marqueId || '' });
    else setForm({ designation: '', prixVente: '', prixAchat: '', seuilCritique: 0, familleId: '', marqueId: '' });
  }, [edit, isOpen]);

  useEffect(() => {
    api.get(`/${metier}/familles`).then(r => setFamilles(r.data?.data || r.data || [])).catch(() => {});
    api.get(`/${metier}/marques`).then(r => setMarques(r.data?.data || r.data || [])).catch(() => {});
  }, [metier]);

  const prefix = metier ? `/${metier}` : '';

  const validate = () => {
    const errs = {};
    if (!form.designation || form.designation.length < 2) errs.designation = 'La désignation est obligatoire (min 2 caractères)';
    if (!form.prixVente || Number(form.prixVente) <= 0) errs.prixVente = 'Le prix de vente doit être supérieur à 0';
    if (form.prixAchat && Number(form.prixAchat) < 0) errs.prixAchat = 'Le prix d\'achat doit être positif';
    if (form.seuilCritique < 0) errs.seuilCritique = 'Le seuil doit être positif ou nul';
    return errs;
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const defaultEndpoint = prefix + '/articles';
  const endpoint = edit ? `${defaultEndpoint}/${edit.id}` : defaultEndpoint;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(endpoint, form);
      else await api.post(endpoint, form);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={title || (edit ? '✏️ Modifier l\'article' : '📦 Nouvel article')} loading={loading} submitIcon={edit ? '💾' : '➕'} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Désignation" name="designation" value={form.designation} onChange={set('designation')} required error={errors.designation?.message} placeholder="Nom de l'article" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Prix de vente" name="prixVente" type="number" value={form.prixVente} onChange={set('prixVente')} required min={0} unit="FCFA" error={errors.prixVente?.message} />
        <FormField label="Prix d'achat" name="prixAchat" type="number" value={form.prixAchat} onChange={set('prixAchat')} min={0} unit="FCFA" error={errors.prixAchat?.message} hint="Optionnel, pour calcul des marges" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Seuil critique" name="seuilCritique" type="number" value={form.seuilCritique} onChange={set('seuilCritique')} min={0} error={errors.seuilCritique?.message} hint="Alerte stock minimum" />
        <FormField label="Famille" name="familleId" type="select" value={form.familleId} onChange={set('familleId')} options={familles.map(f => ({ value: f.id, label: f.nom }))} />
      </div>
      {familles.length > 0 && (
        <FormField label="Marque" name="marqueId" type="select" value={form.marqueId} onChange={set('marqueId')} options={marques.map(m => ({ value: m.id, label: m.nom }))} />
      )}
      {extraFields && (
        <div className="space-y-4 pt-2 border-t border-slate-700/50">
          {extraFields({ form, set, errors })}
        </div>
      )}
    </FormModal>
  );
}
