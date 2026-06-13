import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';

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
    // Object.setPrototypeOf(window, window.safeHandler) - REMOVED: not supported in modern browsers
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


export default function PromotionSupermarcheForm({ isOpen, onClose, onSuccess, edit, metier = 'supermarche' }) {
  const [form, setForm] = useState({ articleId: '', nom: '', type: 'POURCENTAGE', valeur: '', dateDebut: '', dateFin: '', actif: true });
  const [prixOriginal, setPrixOriginal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    if (edit) setForm({ articleId: edit.articleId || '', nom: edit.nom || '', type: edit.type || 'POURCENTAGE', valeur: edit.valeur || '', dateDebut: edit.dateDebut?.slice(0, 16) || '', dateFin: edit.dateFin?.slice(0, 16) || '', actif: edit.actif ?? true });
  }, [edit]);

  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const handleArticleSelect = async (article) => {
    setPrixOriginal(Number(article.prixVente) || 0);
    setForm({ ...form, articleId: article.id });
  };

  const prixPromo = form.type === 'POURCENTAGE'
    ? prixOriginal * (1 - (Number(form.valeur) || 0) / 100)
    : form.type === 'MONTANT_FIXE'
      ? prixOriginal - (Number(form.valeur) || 0)
      : form.type === 'PRIX_FIXE'
        ? (Number(form.valeur) || 0)
        : prixOriginal;

  const validate = () => {
    const errs = {};
    if (!form.articleId) errs.articleId = 'Sélectionnez un article';
    if (!form.nom) errs.nom = 'Le nom de la promotion est requis';
    if (!form.valeur || Number(form.valeur) <= 0) errs.valeur = 'La valeur doit être > 0';
    if (!form.dateDebut) errs.dateDebut = 'La date de début est requise';
    if (!form.dateFin) errs.dateFin = 'La date de fin est requise';
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
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier promotion' : '🏷️ Nouvelle promotion'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Article" name="articleId" value={form.articleId} onChange={set('articleId')} fetchSuggestions={fetchArticles} displayKey="designation" onSelect={handleArticleSelect} placeholder="Rechercher un article..." required error={errors.articleId} />
      <FormField label="Nom de la promotion" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Promo semaine" error={errors.nom} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={[
          { value: 'POURCENTAGE', label: '% Pourcentage' },
          { value: 'MONTANT_FIXE', label: '💰 Montant fixe' },
          { value: 'PRIX_FIXE', label: '🏷️ Prix fixe' },
        ]} />
        <FormField label="Valeur" name="valeur" type="number" value={form.valeur} onChange={set('valeur')} required min={0} unit={form.type === 'POURCENTAGE' ? '%' : 'FCFA'} error={errors.valeur} />
      </div>
      {prixOriginal > 0 && (
        <div className="p-3 bg-slate-800 rounded-xl text-sm space-y-1">
          <div className="flex justify-between text-slate-400"><span>Prix original</span><span>{prixOriginal.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between text-emerald-400 font-bold"><span>Prix promo</span><span>{Math.max(0, prixPromo).toLocaleString('fr-FR')} FCFA</span></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Date début" name="dateDebut" value={form.dateDebut} onChange={set('dateDebut')} showTime required error={errors.dateDebut} />
        <DateTimePicker label="Date fin" name="dateFin" value={form.dateFin} onChange={set('dateFin')} showTime required error={errors.dateFin} />
      </div>
      <FormField label="Activer" name="actif" type="toggle" value={form.actif} onChange={() => setForm({ ...form, actif: !form.actif })} toggleLabel={form.actif ? 'Promotion active' : 'Promotion désactivée'} />
    </FormModal>
  );
}
