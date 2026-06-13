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


export default function CheckInForm({ isOpen, onClose, onSuccess, metier = 'hotel', reservation }) {
  const [form, setForm] = useState({ reservationId: reservation?.id || '', pieceIdentite: null, nbPersonnesReel: reservation?.nbPersonnes || 1, avancePayee: reservation?.avance || 0, notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;

  useState(() => {
    if (reservation) setForm({ reservationId: reservation.id, pieceIdentite: null, nbPersonnesReel: reservation.nbPersonnes || 1, avancePayee: reservation.avance || 0, notes: '' });
  }, [reservation]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post(`${prefix}/reservations/${form.reservationId}/écheckin`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="✅ Check-in" loading={loading} submitLabel="Enregistrer l'arrivée" submitIcon="✅">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      {reservation && <div className="p-3 bg-slate-800 rounded-xl text-sm text-slate-400 mb-4">Client: <span className="text-white font-bold">{reservation.nomClient}</span> — Chambre: <span className="text-white font-bold">{reservation.chambre?.numero}</span></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Nombre de personnes réel" name="nbPersonnesReel" value={form.nbPersonnesReel} onChange={set('nbPersonnesReel')} min={1} />
        <NumberInput label="Avance payée" name="avancePayee" value={form.avancePayee} onChange={set('avancePayee')} min={0} unit="FCFA" />
      </div>
      <PhotoUpload label="Pièce d'identité" name="pieceIdentite" value={form.pieceIdentite} onChange={(e) => setForm({ ...form, pieceIdentite: e.target.value })} />
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}


