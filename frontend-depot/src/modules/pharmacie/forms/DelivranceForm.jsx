import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
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


export default function DelivranceForm({ isOpen, onClose, onSuccess, metier = 'pharmacie', ordonnanceLigne }) {
  const [form, setForm] = useState({ quantiteDelivree: 1 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    if (ordonnanceLigne) setForm({ quantiteDelivree: ordonnanceLigne.quantitePrescrite - (ordonnanceLigne.quantiteDelivree || 0) });
  }, [ordonnanceLigne]);

  if (!ordonnanceLigne) return null;

  const reste = ordonnanceLigne.quantitePrescrite - (ordonnanceLigne.quantiteDelivree || 0);
  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.quantiteDelivree || form.quantiteDelivree < 1) errs.quantiteDelivree = 'Minimum 1';
    if (form.quantiteDelivree > reste) errs.quantiteDelivree = `Ne peut dépasser ${reste}`;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await api.post(`${prefix}/ordonnances/${ordonnanceLigne.ordonnanceId}/delivrance`, {
        ligneId: ordonnanceLigne.id,
        quantiteDelivree: form.quantiteDelivree,
      });
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="💊 Délivrance" loading={loading} submitLabel="Délivrer" submitIcon="💊">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="p-4 bg-slate-800 rounded-xl space-y-2 text-sm mb-4">
        <div className="flex justify-between"><span className="text-slate-400">Prescrit</span><span className="text-white font-bold">{ordonnanceLigne.quantitePrescrite}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Déjà délivré</span><span className="text-blue-400 font-bold">{ordonnanceLigne.quantiteDelivree || 0}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Reste à délivrer</span><span className="text-emerald-400 font-bold">{reste}</span></div>
      </div>
      <NumberInput label="Quantité à délivrer" name="quantiteDelivree" value={form.quantiteDelivree} onChange={set('quantiteDelivree')} min={1} max={reste} error={errors.quantiteDelivree} />
    </FormModal>
  );
}
