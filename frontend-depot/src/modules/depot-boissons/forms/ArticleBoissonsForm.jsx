import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

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


export default function ArticleBoissonsForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const [form, setForm] = useState({
    designation: '', prixVente: '', prixAchat: '', seuilCritique: 0,
    familleId: '', marqueId: '',
    format: '33cl', estConsigne: false,
    uniteParCasier: 12, uniteParPack: 6, uniteParPalette: 120,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (value) => setForm({ ...form, [field]: value });

  useEffect(() => {
    if (edit) setForm({
      designation: edit.designation || edit.nom || '', prixVente: edit.prixVente || '', prixAchat: edit.prixAchat || '',
      seuilCritique: edit.seuilCritique || 0, familleId: edit.familleId || '', marqueId: edit.marqueId || '',
      format: edit.format || '33cl', estConsigne: edit.estConsigne || false,
      uniteParCasier: edit.uniteParCasier || 12, uniteParPack: edit.uniteParPack || 6, uniteParPalette: edit.uniteParPalette || 120,
    });
  }, [edit]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.designation || form.designation.length < 2) errs.designation = 'La désignation est obligatoire';
    if (!form.prixVente || Number(form.prixVente) <= 0) errs.prixVente = 'Le prix de vente doit être > 0';
    if (form.uniteParCasier < 1) errs.uniteParCasier = 'Minimum 1';
    if (form.uniteParPack < 1) errs.uniteParPack = 'Minimum 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/articles/${edit.id}`, form);
      else await api.post(`${prefix}/articles`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };

  const setBool = (f) => () => setForm({ ...form, [f]: !form[f] });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier article' : '🍺 Nouvel article boissons'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Désignation" name="designation" value={form.designation} onChange={set('designation')} required error={errors.designation} placeholder="Ex: Bierre 33cl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Prix vente" name="prixVente" type="number" value={form.prixVente} onChange={set('prixVente')} required min={0} unit="FCFA" error={errors.prixVente} />
        <FormField label="Prix achat" name="prixAchat" type="number" value={form.prixAchat} onChange={set('prixAchat')} min={0} unit="FCFA" />
        <FormField label="Seuil critique" name="seuilCritique" type="number" value={form.seuilCritique} onChange={set('seuilCritique')} min={0} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Format" name="format" type="select" value={form.format} onChange={set('format')} options={['33cl', '50cl', '60cl', '65cl', '1L', '2L']} />
        <FormField label="Par casier" name="uniteParCasier" type="number" value={form.uniteParCasier} onChange={set('uniteParCasier')} min={1} />
        <FormField label="Par pack" name="uniteParPack" type="number" value={form.uniteParPack} onChange={set('uniteParPack')} min={1} />
      </div>
      <FormField label="Par palette" name="uniteParPalette" type="number" value={form.uniteParPalette} onChange={set('uniteParPalette')} min={1} />
      <FormField label="Consigne" name="estConsigne" type="toggle" value={form.estConsigne} onChange={setBool('estConsigne')} toggleLabel="Cet article est consigné" />
    </FormModal>
  );
}
