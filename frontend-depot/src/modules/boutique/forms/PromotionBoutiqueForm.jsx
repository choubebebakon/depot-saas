import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { libelle: '', type: 'REMISE', valeur: '', dateDebut: '', dateFin: '', articleId: '' };

export default function PromotionBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: articles } = useQuery({
    queryKey: ['boutique-articles'],
    queryFn: async () => {
      const res = await api.get('/boutique/articles');
      return res.data?.data || res.data || [];
    },
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useEffect(() => {
    if (edit) setForm({ libelle: edit.libelle || edit.nom || '', type: edit.type || 'REMISE', valeur: edit.valeur ?? '', dateDebut: edit.dateDebut || '', dateFin: edit.dateFin || '', articleId: edit.articleId || '' });
    else setForm({ ...initialState });
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.libelle?.trim()) errs.libelle = 'Le libellé est requis';
    if (!form.articleId?.trim()) errs.articleId = 'L\'article est requis';
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
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? 'Modifier' : 'Nouvelle Promotion'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Libellé" name="libelle" value={form.libelle} onChange={set('libelle')} required error={errors.libelle} placeholder="Libellé de la promotion" />
      <div className="mt-4">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Article</label>
        <select
          name="articleId"
          value={form.articleId}
          onChange={set('articleId')}
          disabled={loading}
          className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
        >
          <option value="">Sélectionner un article</option>
          {articles?.map(a => (
            <option key={a.id} value={a.id}>{a.designation}</option>
          ))}
        </select>
        {errors.articleId && <span className="text-red-400 text-xs mt-1">{errors.articleId}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={['REMISE', 'OFFRE_SPECIALE']} />
        <FormField label="Valeur" name="valeur" type="number" value={form.valeur} onChange={set('valeur')} min="0" placeholder="0" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Date début" name="dateDebut" type="datetime-local" value={form.dateDebut} onChange={set('dateDebut')} />
        <FormField label="Date fin" name="dateFin" type="datetime-local" value={form.dateFin} onChange={set('dateFin')} />
      </div>
    </FormModal>
  );
}
