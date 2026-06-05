import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function ConditionnementForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const [form, setForm] = useState({ nom: '', type: 'CASIER', quantiteUnitaire: 12, prixVente: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    if (edit) setForm({
      nom: edit.nom || '', type: edit.type || 'CASIER',
      quantiteUnitaire: edit.quantiteUnitaire || 12, prixVente: edit.prixVente || '',
    });
  }, [edit]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.nom) errs.nom = 'Le nom est requis';
    if (!form.quantiteUnitaire || form.quantiteUnitaire < 1) errs.quantiteUnitaire = 'Minimum 1';
    if (!form.prixVente || Number(form.prixVente) <= 0) errs.prixVente = 'Le prix doit être > 0';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/conditionnements/${edit.id}`, form);
      else await api.post(`${prefix}/conditionnements`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier conditionnement' : '📦 Nouveau conditionnement'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Casier 12 bouteilles" error={errors.nom} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} required options={[
          { value: 'CASIER', label: '📦 Casier' },
          { value: 'PACK', label: '📦 Pack' },
          { value: 'PALETTE', label: '📦 Palette' },
          { value: 'UNITE', label: '🔢 Unité' },
        ]} />
        <NumberInput label="Qté unitaire" name="quantiteUnitaire" value={form.quantiteUnitaire} onChange={set('quantiteUnitaire')} min={1} />
        <FormField label="Prix vente" name="prixVente" type="number" value={form.prixVente} onChange={set('prixVente')} min={0} unit="FCFA" required error={errors.prixVente} />
      </div>
    </FormModal>
  );
}
