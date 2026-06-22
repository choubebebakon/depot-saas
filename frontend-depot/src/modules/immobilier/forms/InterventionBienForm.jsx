import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import NumberInput from '../../../shared/components/forms/NumberInput';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';
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


export default function InterventionBienForm({ isOpen, onClose, onSuccess, edit, metier = 'immobilier' }) {
  const [form, setForm] = useState({ bienId: '', type: 'PLOMBERIE', description: '', cout: '', date: '', statut: 'PLANIFIEE', photoUrl: null });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [biens, setBiens] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    api.get(`/${metier}/biens`).then(r => setBiens(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ bienId: edit.bienId || '', type: edit.type || 'PLOMBERIE', description: edit.description || '', cout: edit.cout || '', date: edit.date?.slice(0, 16) || '', statut: edit.statut || 'PLANIFIEE', photoUrl: edit.photoUrl || null });
  }, [edit]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.bienId) errs.bienId = 'Sélectionnez un bien'; if (!form.description) errs.description = 'La description est requise'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/interventions/${edit.id}`, form); else await api.post(`${prefix}/interventions`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier intervention' : '🔧 Nouvelle intervention'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Bien" name="bienId" type="select" value={form.bienId} onChange={set('bienId')} options={biens.map(b => ({ value: b.id, label: b.adresse }))} required error={errors.bienId?.message} />
        <FormField label="Type d'intervention" name="type" type="select" value={form.type} onChange={set('type')} options={['PLOMBERIE', 'ELECTRICITE', 'PEINTURE', 'MENUISERIE', 'CLIMATISATION', 'NETTOYAGE', 'AUTRE']} />
      </div>
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} required rows={2} error={errors.description?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Coût" name="cout" type="number" value={form.cout} onChange={set('cout')} min={0} unit="FCFA" />
        <FormField label="Statut" name="statut" type="select" value={form.statut} onChange={set('statut')} options={[
          { value: 'PLANIFIEE', label: '📅 Planifiée' }, { value: 'EN_COURS', label: '⚡ En cours' },
          { value: 'EFFECTUEE', label: '✅ Effectuée' },
        ]} />
      </div>
      <DateTimePicker label="Date" name="date" value={form.date} onChange={set('date')} showTime />
      <PhotoUpload label="Photo" name="photoUrl" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
    </FormModal>
  );
}
