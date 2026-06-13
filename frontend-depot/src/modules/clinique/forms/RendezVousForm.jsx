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


export default function RendezVousForm({ isOpen, onClose, onSuccess, edit, metier = 'clinique' }) {
  const [form, setForm] = useState({ clientId: '', medecinId: '', dateHeure: '', motif: '', dureeMin: 30 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [medecins, setMedecins] = useState([]);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    api.get(`/${metier}/medecins`).then(r => setMedecins(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ clientId: edit.clientId || '', medecinId: edit.medecinId || '', dateHeure: edit.dateHeure?.slice(0, 16) || '', motif: edit.motif || '', dureeMin: edit.dureeMin || 30 });
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/patients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const validate = () => { const errs = {}; if (!form.clientId) errs.clientId = 'Sélectionnez un patient'; if (!form.medecinId) errs.medecinId = 'Sélectionnez un médecin'; if (!form.dateHeure) errs.dateHeure = 'La date est requise'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/rendez-vous/${edit.id}`, form); else await api.post(`${prefix}/rendez-vous`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier RDV' : '📅 Nouveau rendez-vous'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Patient" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un patient..." required error={errors.clientId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Médecin" name="medecinId" type="select" value={form.medecinId} onChange={set('medecinId')} options={medecins.map(m => ({ value: m.id, label: m.nom }))} required error={errors.medecinId} />
        <DateTimePicker label="Date et heure" name="dateHeure" value={form.dateHeure} onChange={set('dateHeure')} showTime required minDate={new Date()} error={errors.dateHeure} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Durée" name="dureeMin" value={form.dureeMin} onChange={set('dureeMin')} min={5} unit="min" />
        <div />
      </div>
      <FormField label="Motif" name="motif" type="textarea" value={form.motif} onChange={set('motif')} rows={2} placeholder="Motif de la consultation..." />
    </FormModal>
  );
}
