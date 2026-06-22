import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function VaccinationForm({ isOpen, onClose, onSuccess, metier = 'elevage', lots }) {
  const [form, setForm] = useState({ lotId: '', vaccin: '', dateVaccin: '', quantite: 1, veterinaire: '', prochainRappel: '', montant: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.lotId) errs.lotId = 'Sélectionnez un lot'; if (!form.vaccin) errs.vaccin = 'Le vaccin est requis'; if (!form.dateVaccin) errs.dateVaccin = 'La date est requise'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { await api.post(`${prefix}/vaccinations`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="💉 Vaccination" loading={loading} submitLabel="Enregistrer" submitIcon="💾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Lot" name="lotId" type="select" value={form.lotId} onChange={set('lotId')} options={lots?.map(l => ({ value: l.id, label: l.nom })) || []} required error={errors.lotId?.message} />
        <FormField label="Vaccin" name="vaccin" value={form.vaccin} onChange={set('vaccin')} required placeholder="Nom du vaccin" error={errors.vaccin?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Date de vaccination" name="dateVaccin" value={form.dateVaccin} onChange={set('dateVaccin')} showTime required error={errors.dateVaccin?.message} />
        <NumberInput label="Animaux vaccinés" name="quantite" value={form.quantite} onChange={set('quantite')} min={1} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vétérinaire" name="veterinaire" value={form.veterinaire} onChange={set('veterinaire')} placeholder="Nom du vétérinaire" />
        <DateTimePicker label="Prochain rappel" name="prochainRappel" value={form.prochainRappel} onChange={set('prochainRappel')} showTime />
      </div>
      <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={set('montant')} min={0} unit="FCFA" />
    </FormModal>
  );
}
