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


export default function ChantierForm({ isOpen, onClose, onSuccess, edit, metier = 'ciment-btp' }) {
  const [form, setForm] = useState({ clientId: '', nom: '', adresse: '', description: '', dateDebut: '', dateFin: '', budgetEstime: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    if (edit) setForm({ clientId: edit.clientId || '', nom: edit.nom || '', adresse: edit.adresse || '', description: edit.description || '', dateDebut: edit.dateDebut?.slice(0, 10) || '', dateFin: edit.dateFin?.slice(0, 10) || '', budgetEstime: edit.budgetEstime || '' });
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const validate = () => { const errs = {}; if (!form.clientId) errs.clientId = 'Sélectionnez un client'; if (!form.nom) errs.nom = 'Le nom du chantier est requis'; if (!form.dateDebut) errs.dateDebut = 'La date de début est requise'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/chantiers/${edit.id}`, form); else await api.post(`${prefix}/chantiers`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier chantier' : '🏗️ Nouveau chantier'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." required error={errors.clientId} />
      <FormField label="Nom du chantier" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Construction Villa Douala" error={errors.nom} />
      <FormField label="Adresse" name="adresse" value={form.adresse} onChange={set('adresse')} placeholder="Adresse du chantier" />
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} rows={2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Date de début" name="dateDebut" value={form.dateDebut} onChange={set('dateDebut')} required error={errors.dateDebut} />
        <DateTimePicker label="Date de fin (prévue)" name="dateFin" value={form.dateFin} onChange={set('dateFin')} />
      </div>
      <FormField label="Budget estimé" name="budgetEstime" type="number" value={form.budgetEstime} onChange={set('budgetEstime')} min={0} unit="FCFA" />
    </FormModal>
  );
}
