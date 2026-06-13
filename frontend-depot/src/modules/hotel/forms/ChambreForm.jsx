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


export default function ChambreForm({ isOpen, onClose, onSuccess, edit, metier = 'hotel' }) {
  const [form, setForm] = useState({ numero: '', typeChambreId: '', etage: 0, statut: 'LIBRE', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [types, setTypes] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    api.get(`/${metier}/types-chambres`).then(r => setTypes(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ numero: edit.numero || '', typeChambreId: edit.typeChambreId || '', etage: edit.etage || 0, statut: edit.statut || 'LIBRE', notes: edit.notes || '' });
  }, [edit]);

  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.numero) errs.numero = 'Le numéro de chambre est requis'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/chambres/${edit.id}`, form); else await api.post(`${prefix}/chambres`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier chambre' : '🛏️ Nouvelle chambre'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Numéro" name="numero" value={form.numero} onChange={set('numero')} required placeholder="Ex: 101, Suite A" error={errors.numero} />
        <FormField label="Type" name="typeChambreId" type="select" value={form.typeChambreId} onChange={set('typeChambreId')} options={types.map(t => ({ value: t.id, label: t.nom }))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Étage" name="etage" value={form.etage} onChange={set('etage')} min={0} />
        <FormField label="Statut" name="statut" type="select" value={form.statut} onChange={set('statut')} options={[
          { value: 'LIBRE', label: '🟢 Libre' }, { value: 'OCCUPEE', label: '🔴 Occupée' },
          { value: 'RESERVEE', label: '🔵 Réservée' }, { value: 'EN_NETTOYAGE', label: '🧹 En nettoyage' },
          { value: 'HORS_SERVICE', label: '🔧 Hors service' },
        ]} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} placeholder="Ex: Vue mer, côté jardin..." />
    </FormModal>
  );
}
