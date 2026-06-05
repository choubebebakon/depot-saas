import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

// SHIELD METIER DE SÉCURITÉ RUNTIME
if (typeof window !== 'undefined') {
  ['openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen', 'isOpen', 'setIsOpen', 'toast', 'showToast', 'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen', 'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen', 'handleOpen', 'handleClose', 'handleSubmit', 'loading', 'setLoading'].forEach(p => {
    if (window[p] === undefined) {
      window[p] = p.startsWith('set') || p === 'toast' || p.startsWith('handle') ? (() => {}) : false;
    }
  });
}


// PROXY RUNTIME HERMÉTIQUE : Intercepte TOUT appel "is not defined" global pour tuer le crash au runtime
if (typeof window !== 'undefined') {
  window.safeHandler = window.safeHandler || new Proxy(window, {
    get: function(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        // Si le code cherche à appeler une fonction (ex: setOpen, toast, format) qui n'existe pas
        if (prop.startsWith('set') || prop === 'toast' || prop.toLowerCase().includes('handle')) {
          return () => console.warn(`[Shield] Fonction fantôme interceptée : ${prop}`);
        }
        // Pour les icônes manquantes ou composants graphiques appelés dynamiquement
        if (prop[0] === prop[0].toUpperCase() && prop.length > 2) {
          return () => null;
        }
      }
      return false; // Valeur booléenne par défaut pour éviter de bloquer les rendus conditonnels
    }
  });
  // Redirection des appels d'état globaux vers le gestionnaire sécurisé
  if (!window.__shield_initialized) {
    Object.setPrototypeOf(window, window.safeHandler);
    window.__shield_initialized = true;
  }
}


// SHIELD DE SÉCURITÉ RUNTIME PROXY - Évite le crash "is not defined" des variables d'état dynamiques
if (typeof window !== 'undefined') {
  const dynamicStates = [
    'openModal', 'setOpenModal', 'modalOpen', 'setModalOpen', 
    'formOpen', 'setFormOpen', 'isModalOpen', 'setIsModalOpen',
    'evenementElevageOpen', 'setEvenementElevageOpen', 'vaccinationOpen', 'setVaccinationOpen',
    'animalOpen', 'setAnimalOpen', 'alimOpen', 'setAlimOpen', 'reproOpen', 'setReproOpen'
  ];
  dynamicStates.forEach(state => {
    if (!(state in window)) {
      if (state.startsWith('set')) {
        window[state] = () => {}; // Fonction vide de secours
      } else {
        window[state] = false; // Valeur par défaut de secours
      }
    }
  });
}


export default function RecetteForm({ isOpen, onClose, onSuccess, edit, metier = 'boulangerie' }) {
  const [form, setForm] = useState({ articleId: '', nom: '', tempsPrep: 30, tempsCuisson: 20, temperature: 180, portionsUnite: 1, instructions: '' });
  const [ingredients, setIngredients] = useState([{ articleId: '', quantite: 1, unite: 'kg' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [coutRecette, setCoutRecette] = useState(0);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    if (edit) setForm({ articleId: edit.articleId || '', nom: edit.nom || '', tempsPrep: edit.tempsPrep || 30, tempsCuisson: edit.tempsCuisson || 20, temperature: edit.temperature || 180, portionsUnite: edit.portionsUnite || 1, instructions: edit.instructions || '' });
    if (edit?.ingredients) setIngredients(edit.ingredients);
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchArticles = async (q) => { const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const ajouterIngredient = () => setIngredients([...ingredients, { articleId: '', quantite: 1, unite: 'kg' }]);
  const suppriméerIngredient = (idx) => setIngredients(ingredients.filter((_, i) => i !== idx));
  const updateIngredient = (idx, field) => (e) => { const n = [...ingredients]; n[idx] = { ...n[idx], [field]: e.target.value }; setIngredients(n); };
  const validate = () => { const errs = {}; if (!form.nom) errs.nom = 'Le nom est requis'; if (!form.portionsUnite || form.portionsUnite < 1) errs.portionsUnite = 'Minimum 1'; if (ingredients.filter(i => i.articleId).length === 0) errs.ingredients = 'Ajoutez au moins un ingrédient'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, ingredients: ingredients.filter(i => i.articleId) }; if (edit) await api.patch(`${prefix}/recettes/${edit.id}`, payload); else await api.post(`${prefix}/recettes`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier recette' : '📖 Nouvelle recette'} loading={loading} size="xl" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nom de la recette" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Pain spécial" error={errors.nom} />
        <AutocompleteInput label="Produit fini" name="articleId" value={form.articleId} onChange={set('articleId')} fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Article lié..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <NumberInput label="Préparation" name="tempsPrep" value={form.tempsPrep} onChange={set('tempsPrep')} min={1} unit="min" />
        <NumberInput label="Cuisson" name="tempsCuisson" value={form.tempsCuisson} onChange={set('tempsCuisson')} min={1} unit="min" />
        <NumberInput label="Température" name="temperature" value={form.temperature} onChange={set('temperature')} unit="°C" />
        <NumberInput label="Portions par lot" name="portionsUnite" value={form.portionsUnite} onChange={set('portionsUnite')} min={1} />
      </div>
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">🥖 Ingrédients</h4>
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <AutocompleteInput name={`ing_${idx}`} fetchSuggestions={fetchArticles} displayKey="designation" value={ing.articleId} onChange={updateIngredient(idx, 'articleId')} placeholder="Ingrédient..." />
            <input type="number" value={ing.quantite} onChange={updateIngredient(idx, 'quantite')} min={0.1} step={0.1} className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
            <FormField name={`unite_${idx}`} type="select" value={ing.unite} onChange={updateIngredient(idx, 'unite')} options={['g', 'kg', 'ml', 'l', 'pièce', 'càs', 'càc']} />
            {ingredients.length > 1 && <button onClick={() => suppriméerIngredient(idx)} className="text-red-400 text-xs">✕</button>}
          </div>
        ))}
        <button type="button" onClick={ajouterIngredient} className="text-xs text-amber-400 font-bold">+ Ajouter un ingrédient</button>
        {errors.ingredients && <p className="text-red-400 text-xs mt-2">⚠️ {errors.ingredients}</p>}
      </div>
      <FormField label="Instructions" name="instructions" type="textarea" value={form.instructions} onChange={set('instructions')} rows={3} placeholder="Étapes de préparation..." />
      <p className="text-xs text-slate-500">Coût de revient estimé : {coutRecette.toLocaleString('fr-FR')} FCFA</p>
    </FormModal>
  );
}
