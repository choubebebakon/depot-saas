import { useState } from 'react';
import api from '../../api';
import FormModal from '../components/forms/FormModal';
import FormField from '../components/forms/FormField';
import AutocompleteInput from '../components/forms/AutocompleteInput';
import NumberInput from '../components/forms/NumberInput';
import PhotoUpload from '../components/forms/PhotoUpload';

export default function MouvementStockForm({ isOpen, onClose, onSuccess, edit, metier, depotId }) {
  const [form, setForm] = useState({ articleId: '', type: 'ENTREE', quantite: 1, depotId: depotId || '', motif: '', photoUrl: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [stockActuel, setStockActuel] = useState(null);

  const prefix = metier ? `/${metier}` : '';

  const validate = () => {
    const errs = {};
    if (!form.articleId) errs.articleId = 'Sélectionnez un article';
    if (!form.type) errs.type = 'Le type de mouvement est requis';
    if (!form.quantite || form.quantite < 1) errs.quantite = 'La quantité doit être supérieure à 0';
    if (form.type === 'SORTIE' && !form.motif) errs.motif = 'Le motif est obligatoire pour une sortie';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/stock/${edit.id}`, form);
      else await api.post(`${prefix}/stock`, form);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (field === 'articleId') setStockActuel(null);
  };

  const handleArticleSelect = async (article) => {
    try {
      const res = await api.get(`${prefix}/stock/stock-actuel/${article.id}`);
      setStockActuel(res.data?.stock || res.data?.quantite || 0);
    } catch {
      setStockActuel(0);
    }
  };

  const fetchArticles = async (query) => {
    const res = await api.get(`${prefix}/articles`, { params: { search: query, limit: 8 } });
    return res.data?.data || res.data || [];
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier mouvement' : '📦 Mouvement de stock'} loading={loading} size="lg" submitIcon="💾" submitLabel={edit ? 'Modifier' : 'Enregistrer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Article" name="articleId" value={form.articleId} onChange={set('articleId')} fetchSuggestions={fetchArticles} displayKey="designation" onSelect={handleArticleSelect} placeholder="Rechercher un article..." required error={errors.articleId} />
      {stockActuel !== null && (
        <div className="p-3 bg-slate-800 rounded-xl text-sm">
          <span className="text-slate-400">Stock actuel : </span>
          <span className="text-white font-bold">{stockActuel} unité{stockActuel > 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} required error={errors.type}
          options={['ENTREE', 'SORTIE', 'AJUSTEMENT', 'TRANSFERT', 'INVENTAIRE'].map(t => ({ value: t, label: t === 'ENTREE' ? '📥 Entrée' : t === 'SORTIE' ? '📤 Sortie' : t === 'AJUSTEMENT' ? '⚖️ Ajustement' : t === 'TRANSFERT' ? '🔄 Transfert' : '📋 Inventaire' }))} />
        <NumberInput label="Quantité" name="quantite" value={form.quantite} onChange={set('quantite')} min={1} required />
      </div>
      {form.type === 'SORTIE' && (
        <FormField label="Motif de sortie" name="motif" type="textarea" value={form.motif} onChange={set('motif')} required error={errors.motif} placeholder="Raison de la sortie..." rows={2} />
      )}
      <PhotoUpload label="Photo (optionnel)" name="photoUrl" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
    </FormModal>
  );
}
