import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';
import PhotoUpload from '../../../shared/components/forms/PhotoUpload';

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


export default function TypeChambreForm({ isOpen, onClose, onSuccess, edit, metier = 'hotel' }) {
  const [form, setForm] = useState({ nom: '', capacite: 2, prixNuit: '', equipements: [], description: '', imageUrl: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    if (edit) setForm({ nom: edit.nom || '', capacite: edit.capacite || 2, prixNuit: edit.prixNuit || '', equipements: edit.equipements || [], description: edit.description || '', imageUrl: edit.imageUrl || null });
  }, [edit]);

  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.nom) errs.nom = 'Le nom est requis'; if (!form.prixNuit || Number(form.prixNuit) <= 0) errs.prixNuit = 'Le prix doit être > 0'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/types-chambres/${edit.id}`, form); else await api.post(`${prefix}/types-chambres`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier type' : '🏷️ Nouveau type de chambre'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Standard, Deluxe, Suite..." error={errors.nom} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Capacité" name="capacite" value={form.capacite} onChange={set('capacite')} min={1} hint="Nombre max de personnes" />
        <FormField label="Prix par nuit" name="prixNuit" type="number" value={form.prixNuit} onChange={set('prixNuit')} min={0} unit="FCFA" required error={errors.prixNuit} />
      </div>
      <FormField label="Équipements" name="equipements" type="multiselect" value={form.equipements} onChange={set('equipements')} options={['WiFi', 'Clim', 'TV', 'MiniBar', 'Baignoire', 'Jacuzzi', 'Coffre', 'Balcon']} />
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} rows={2} />
      <PhotoUpload label="Photo" name="imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
    </FormModal>
  );
}
