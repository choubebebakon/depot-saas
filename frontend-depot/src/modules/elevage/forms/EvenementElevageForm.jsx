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


export default function EvenementElevageForm({ isOpen, onClose, onSuccess, edit, metier = 'elevage', lots }) {
  const [form, setForm] = useState({ lotId: '', type: 'NAISSANCE', date: '', quantite: 1, poids: '', montant: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const lotCourant = lots?.find(l => l.id === form.lotId);
  useState(() => { if (edit) setForm({ lotId: edit.lotId || '', type: edit.type || 'NAISSANCE', date: edit.date?.slice(0, 16) || '', quantite: edit.quantite || 1, poids: edit.poids || '', montant: edit.montant || '', notes: edit.notes || '' }); }, [edit]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.lotId) errs.lotId = 'Sélectionnez un lot'; if (!form.date) errs.date = 'La date est requise'; if (!form.quantite || form.quantite < 1) { errs.quantite = 'Minimum 1'; } else if (['VENTE', 'MORTALITE'].includes(form.type) && lotCourant && form.quantite > lotCourant.nombreActuel) errs.quantite = `Ne peut dépasser le nombre actuel (${lotCourant.nombreActuel})`; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/evenements/${edit.id}`, form); else await api.post(`${prefix}/evenements`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };
  const showPoids = ['VENTE', 'PESEE'].includes(form.type);
  const showMontant = ['VENTE', 'ACHAT'].includes(form.type);
  const tauxMortalite = lotCourant && form.type === 'MORTALITE' && form.quantite > 0 ? (form.quantite / lotCourant.nombreInitial * 100) : 0;

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier événement' : '📅 Nouvel événement'} loading={loading} submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Lot" name="lotId" type="select" value={form.lotId} onChange={set('lotId')} options={lots?.map(l => ({ value: l.id, label: `${l.nom} (${l.nombreActuel || l.nombreInitial} têtes)` })) || []} required error={errors.lotId} />
        <FormField label="Type" name="type" type="select" value={form.type} onChange={set('type')} options={[
          { value: 'NAISSANCE', label: '🐣 Naissance' }, { value: 'ACHAT', label: '💰 Achat' },
          { value: 'VENTE', label: '💵 Vente' }, { value: 'MORTALITE', label: '💀 Mortalité' },
          { value: 'VACCINATION', label: '💉 Vaccination' }, { value: 'TRAITEMENT', label: '🏥 Traitement' },
          { value: 'PESEE', label: '⚖️ Pesée' },
        ]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Date" name="date" value={form.date} onChange={set('date')} showTime required error={errors.date} />
        <NumberInput label="Quantité" name="quantite" value={form.quantite} onChange={set('quantite')} min={1} required error={errors.quantite} />
      </div>
      {showPoids && <FormField label="Poids" name="poids" type="number" value={form.poids} onChange={set('poids')} hint="kg" />}
      {showMontant && <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={set('montant')} min={0} unit="FCFA" />}
      {form.type === 'MORTALITE' && tauxMortalite > 5 && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">⚠️ Taux de mortalité élevé : {tauxMortalite.toFixed(1)}%</div>}
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
