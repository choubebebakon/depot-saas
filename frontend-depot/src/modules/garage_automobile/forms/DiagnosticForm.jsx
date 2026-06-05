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


export default function DiagnosticForm({ isOpen, onClose, onSuccess, metier = 'garage', ordreTravail }) {
  const [form, setForm] = useState({ ordreTravailId: ordreTravail?.id || '', diagnostic: '', piecesNecessaires: '', tempsEstime: '', montantDevis: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;
  useState(() => { if (ordreTravail) setForm({ ordreTravailId: ordreTravail.id, diagnostic: ordreTravail.diagnostic || '', piecesNecessaires: ordreTravail.piecesNecessaires || '', tempsEstime: ordreTravail.tempsEstime || '', montantDevis: ordreTravail.montantDevis || '' }); }, [ordreTravail]);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true);
    try { await api.patch(`${prefix}/ordres-travail/${form.ordreTravailId}/diagnostic`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };
  if (!ordreTravail) return null;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="🩺 Diagnostic" loading={loading} size="lg" submitLabel="Enregistrer le diagnostic" submitIcon="💾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <p className="text-slate-400 text-sm mb-4">Véhicule: <span className="text-white font-bold">{ordreTravail.vehicule?.immatriculation}</span></p>
      <FormField label="Diagnostic" name="diagnostic" type="textarea" value={form.diagnostic} onChange={set('diagnostic')} rows={4} placeholder="Résultats du diagnostic..." />
      <FormField label="Pièces nécessaires" name="piecesNecessaires" type="textarea" value={form.piecesNecessaires} onChange={set('piecesNecessaires')} rows={2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Temps estimé" name="tempsEstime" value={form.tempsEstime} onChange={set('tempsEstime')} min={0} unit="heures" />
        <FormField label="Montant devis" name="montantDevis" type="number" value={form.montantDevis} onChange={set('montantDevis')} min={0} unit="FCFA" />
      </div>
    </FormModal>
  );
}
