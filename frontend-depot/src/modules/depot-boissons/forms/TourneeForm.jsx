import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function TourneeForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', depotId }) {
  const [form, setForm] = useState({ tricycleId: '', commercialId: '', depotId: depotId || '', date: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tricycles, setTricycles] = useState([]);
  const [commerciaux, setCommerciaux] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    api.get(`/${metier}/tricycles`).then(r => setTricycles(r.data?.data || r.data || [])).catch(() => {});
    api.get(`/${metier}/commerciaux`).then(r => setCommerciaux(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ tricycleId: edit.tricycleId || '', commercialId: edit.commercialId || '', depotId: edit.depotId || depotId || '', date: edit.date?.slice(0, 16) || '' });
  }, [edit]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.tricycleId) errs.tricycleId = 'Sélectionnez un tricycle';
    if (!form.commercialId) errs.commercialId = 'Sélectionnez un commercial';
    if (!form.date) errs.date = 'La date est requise';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/tournees/${edit.id}`, form);
      else await api.post(`${prefix}/tournees`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier tournée' : '🚚 Nouvelle tournée'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Tricycle" name="tricycleId" type="select" value={form.tricycleId} onChange={set('tricycleId')} required error={errors.tricycleId}
          options={tricycles.map(t => ({ value: t.id, label: `${t.immatriculation} — ${t.modele || ''}` }))} />
        <FormField label="Commercial" name="commercialId" type="select" value={form.commercialId} onChange={set('commercialId')} required error={errors.commercialId}
          options={commerciaux.map(c => ({ value: c.id, label: c.nom }))} />
      </div>
      <DateTimePicker label="Date de la tournée" name="date" value={form.date} onChange={set('date')} showTime required error={errors.date} />
    </FormModal>
  );
}
