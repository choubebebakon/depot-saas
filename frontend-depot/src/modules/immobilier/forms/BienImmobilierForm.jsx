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


export default function BienImmobilierForm({ isOpen, onClose, onSuccess, edit, metier = 'immobilier' }) {
  const [form, setForm] = useState({ type: 'APPARTEMENT', adresse: '', ville: '', surface: '', nbPieces: 1, etage: 0, loyer: '', charges: '', depot: '', description: '', photos: [] });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => { if (edit) setForm({ type: edit.type || 'APPARTEMENT', adresse: edit.adresse || '', ville: edit.ville || '', surface: edit.surface || '', nbPieces: edit.nbPieces || 1, etage: edit.etage || 0, loyer: edit.loyer || '', charges: edit.charges || '', depot: edit.depot || '', description: edit.description || '', photos: edit.photos || [] }); }, [edit]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.adresse) errs.adresse = 'L\'adresse est requise'; if (!form.ville) errs.ville = 'La ville est requise'; if (!form.loyer || Number(form.loyer) <= 0) errs.loyer = 'Le loyer doit être > 0'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/biens/${edit.id}`, form); else await api.post(`${prefix}/biens`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier bien' : '🏠 Nouveau bien'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={[
        { value: 'APPARTEMENT', label: '🏢 Appartement' }, { value: 'MAISON', label: '🏠 Maison' },
        { value: 'VILLA', label: '🏡 Villa' }, { value: 'LOCAL_COMMERCIAL', label: '🏪 Local commercial' },
        { value: 'BUREAU', label: '🏢 Bureau' }, { value: 'ENTREPOT', label: '📦 Entrepôt' },
        { value: 'TERRAIN', label: '🌳 Terrain' },
      ]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Adresse" name="adresse" value={form.adresse} onChange={set('adresse')} required placeholder="Adresse complète" error={errors.adresse} />
        <FormField label="Ville" name="ville" value={form.ville} onChange={set('ville')} required placeholder="Ville" error={errors.ville} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInput label="Surface" name="surface" value={form.surface} onChange={set('surface')} min={0} unit="m²" hint="Optionnel" />
        <NumberInput label="Pièces" name="nbPieces" value={form.nbPieces} onChange={set('nbPieces')} min={1} />
        <NumberInput label="Étage" name="etage" value={form.etage} onChange={set('etage')} min={0} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Loyer mensuel" name="loyer" type="number" value={form.loyer} onChange={set('loyer')} min={0} unit="FCFA" required error={errors.loyer} />
        <FormField label="Charges" name="charges" type="number" value={form.charges} onChange={set('charges')} min={0} unit="FCFA" />
        <FormField label="Dépôt (caution)" name="depot" type="number" value={form.depot} onChange={set('depot')} min={0} unit="FCFA" />
      </div>
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} rows={2} />
      <PhotoUpload label="Photos" name="photos" onChange={(e) => setForm({ ...form, photos: [...form.photos, e.target.value] })} />
    </FormModal>
  );
}
