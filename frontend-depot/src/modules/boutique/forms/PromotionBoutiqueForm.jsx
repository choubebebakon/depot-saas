import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api';
import { useDepot } from '../../../contexts/DepotContext';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

const initialState = { libelle: '', type: 'REMISE', valeur: '', dateDebut: '', dateFin: '', articleId: '' };

export default function PromotionBoutiqueForm({ isOpen, onClose, onSuccess, edit, metier = 'boutique' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { depotId } = useDepot();

  const { data: articles = [] } = useQuery({
    queryKey: ['boutique-articles', depotId],
    queryFn: async () => {
      const res = await api.get('/boutique/articles', { params: { depotId } });
      return res.data?.data || res.data || [];
    },
    enabled: Boolean(depotId),
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    setErrors({});
    if (edit) {
      setForm({
        libelle: edit.libelle || edit.nom || '',
        type: edit.type || 'REMISE',
        valeur: edit.valeur ?? '',
        dateDebut: edit.dateDebut ? String(edit.dateDebut).slice(0, 16) : '',
        dateFin: edit.dateFin ? String(edit.dateFin).slice(0, 16) : '',
        articleId: edit.articleId || '',
      });
    } else {
      setForm({ ...initialState });
    }
  }, [edit, isOpen]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    const valeur = Number(form.valeur);
    if (!depotId) errs.general = 'Aucun dépôt actif sélectionné';
    if (!form.libelle?.trim()) errs.libelle = 'Le libellé est requis';
    if (!form.articleId?.trim()) errs.articleId = "L'article est requis";
    if (form.valeur === '' || !Number.isFinite(valeur) || valeur < 0) errs.valeur = 'La valeur doit être un nombre positif';
    if (form.type === 'REMISE' && valeur > 100) errs.valeur = 'Une remise ne peut pas dépasser 100 %';
    if (form.dateDebut && form.dateFin && new Date(form.dateFin) < new Date(form.dateDebut)) errs.dateFin = 'La date de fin doit être postérieure au début';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        depotId,
        valeur: Number(form.valeur),
      };
      if (edit) await api.patch(`${prefix}/promotions/${edit.id}`, payload);
      else await api.post(`${prefix}/promotions`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur lors de l’enregistrement de la promotion' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? 'Modifier' : 'Nouvelle Promotion'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      {!depotId && <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl">Sélectionnez d’abord un dépôt actif.</div>}
      <FormField label="Libellé" name="libelle" value={form.libelle} onChange={set('libelle')} required error={errors.libelle} placeholder="Libellé de la promotion" />
      <div className="mt-4">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Article</label>
        <select name="articleId" value={form.articleId} onChange={set('articleId')} disabled={loading || !depotId} className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Sélectionner un article</option>
          {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
        </select>
        {errors.articleId && <span className="text-red-400 text-xs mt-1">{errors.articleId}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={['REMISE', 'OFFRE_SPECIALE']} />
        <FormField label="Valeur" name="valeur" type="number" value={form.valeur} onChange={set('valeur')} min="0" error={errors.valeur} placeholder="0" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <FormField label="Date début" name="dateDebut" type="datetime-local" value={form.dateDebut} onChange={set('dateDebut')} />
        <FormField label="Date fin" name="dateFin" type="datetime-local" value={form.dateFin} onChange={set('dateFin')} error={errors.dateFin} />
      </div>
    </FormModal>
  );
}
