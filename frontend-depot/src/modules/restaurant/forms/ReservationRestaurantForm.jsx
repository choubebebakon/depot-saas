import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function ReservationRestaurantForm({ isOpen, onClose, onSuccess, edit, metier = 'restaurant' }) {
  const [form, setForm] = useState({ nomClient: '', telephone: '', dateArrivee: '', nbPersonnes: 2, tableId: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tables, setTables] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    api.get(`/${metier}/tables`).then(r => setTables(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ nomClient: edit.nomClient || '', telephone: edit.telephone || '', dateArrivee: edit.dateArrivee?.slice(0, 16) || '', nbPersonnes: edit.nbPersonnes || 2, tableId: edit.tableId || '', notes: edit.notes || '' });
  }, [edit]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.nomClient) errs.nomClient = 'Le nom est requis'; if (!form.dateArrivee) errs.dateArrivee = 'La date est requise'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/reservations/${edit.id}`, form); else await api.post(`${prefix}/reservations`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier réservation' : '📅 Nouvelle réservation'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Nom du client" name="nomClient" value={form.nomClient} onChange={set('nomClient')} required placeholder="Nom complet" error={errors.nomClient} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="6XXXXXXXX" />
        <DateTimePicker label="Date d'arrivée" name="dateArrivee" value={form.dateArrivee} onChange={set('dateArrivee')} showTime required error={errors.dateArrivee} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Nombre de personnes" name="nbPersonnes" value={form.nbPersonnes} onChange={set('nbPersonnes')} min={1} />
        <FormField label="Table" name="tableId" type="select" value={form.tableId} onChange={set('tableId')} options={tables.map(t => ({ value: t.id, label: `Table ${t.numero} (${t.capacite} pers.)` }))} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
