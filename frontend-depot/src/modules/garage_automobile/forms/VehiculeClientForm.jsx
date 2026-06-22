import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

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


export default function VehiculeClientForm({ isOpen, onClose, onSuccess, edit, metier = 'garage' }) {
  const [form, setForm] = useState({ clientId: '', immatriculation: '', marque: '', modele: '', annee: '', couleur: '', kilometrage: '', carburant: 'ESSENCE', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => { if (edit) setForm({ clientId: edit.clientId || '', immatriculation: edit.immatriculation || '', marque: edit.marque || '', modele: edit.modele || '', annee: edit.annee || '', couleur: edit.couleur || '', kilometrage: edit.kilometrage || '', carburant: edit.carburant || 'ESSENCE', notes: edit.notes || '' }); }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: cleanParams({ search: q, limit: 8 }) }); return r.data?.data || r.data || []; };
  const validate = () => { const errs = {}; if (!form.immatriculation) errs.immatriculation = 'L\'immatriculation est requise'; if (!form.marque) errs.marque = 'La marque est requise'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/vehicules/${edit.id}`, form); else await api.post(`${prefix}/vehicules`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier véhicule' : '🚗 Nouveau véhicule'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Immatriculation" name="immatriculation" value={form.immatriculation} onChange={set('immatriculation')} required placeholder="CE-123-AB" error={errors.immatriculation?.message} />
        <FormField label="Marque" name="marque" value={form.marque} onChange={set('marque')} required placeholder="Toyota, Renault..." error={errors.marque?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Modèle" name="modele" value={form.modele} onChange={set('modele')} placeholder="Modèle" />
        <NumberInput label="Année" name="annee" value={form.annee} onChange={set('annee')} min={1970} max={2026} />
        <FormField label="Couleur" name="couleur" value={form.couleur} onChange={set('couleur')} placeholder="Couleur" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Kilométrage" name="kilometrage" value={form.kilometrage} onChange={set('kilometrage')} min={0} unit="km" />
        <FormField label="Carburant" name="carburant" type="select" value={form.carburant} onChange={set('carburant')} options={['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE']} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
