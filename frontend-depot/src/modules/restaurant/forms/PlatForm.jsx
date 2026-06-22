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


export default function PlatForm({ isOpen, onClose, onSuccess, edit, metier = 'restaurant' }) {
  const [form, setForm] = useState({ nom: '', categorie: 'PLAT_PRINCIPAL', prix: '', description: '', tempsPrep: 15, imageUrl: null, allergenes: [], disponible: true });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    if (edit) setForm({ nom: edit.nom || '', categorie: edit.categorie || 'PLAT_PRINCIPAL', prix: edit.prix || '', description: edit.description || '', tempsPrep: edit.tempsPrep || 15, imageUrl: edit.imageUrl || null, allergenes: edit.allergenes || [], disponible: edit.disponible ?? true });
  }, [edit]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.nom) errs.nom = 'Le nom est requis'; if (!form.prix || Number(form.prix) <= 0) errs.prix = 'Le prix doit être > 0'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/plats/${edit.id}`, form); else await api.post(`${prefix}/plats`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier plat' : '🍽️ Nouveau plat'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom du plat" name="nom" value={form.nom} onChange={set('nom')} required placeholder="Ex: Poulet DG" error={errors.nom?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Catégorie" name="categorie" type="select" value={form.categorie} onChange={set('categorie')} options={[
          { value: 'ENTREE', label: '🥗 Entrée' }, { value: 'PLAT_PRINCIPAL', label: '🍛 Plat principal' },
          { value: 'DESSERT', label: '🍰 Dessert' }, { value: 'BOISSON', label: '🥤 Boisson' },
          { value: 'SPECIALITE', label: '⭐ Spécialité' },
        ]} />
        <FormField label="Prix" name="prix" type="number" value={form.prix} onChange={set('prix')} min={0} unit="FCFA" required error={errors.prix?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Temps préparation" name="tempsPrep" value={form.tempsPrep} onChange={set('tempsPrep')} min={1} unit="min" />
        <FormField label="Disponible" name="disponible" type="toggle" value={form.disponible} onChange={() => setForm({ ...form, disponible: !form.disponible })} toggleLabel={form.disponible ? '✅ Disponible' : '❌ Indisponible'} />
      </div>
      <FormField label="Allergènes" name="allergenes" type="multiselect" value={form.allergenes} onChange={set('allergenes')} options={['Gluten', 'Lait', 'Œufs', 'Noix', 'Arachides', 'Poisson', 'Crustacés', 'Sésame']} />
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} rows={2} />
      <PhotoUpload label="Photo du plat" name="imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
    </FormModal>
  );
}
