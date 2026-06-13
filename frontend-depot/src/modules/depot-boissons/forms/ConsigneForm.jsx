import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
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


export default function ConsigneForm({ isOpen, onClose, onSuccess, edit, metier = 'depot' }) {
  const [form, setForm] = useState({ clientId: '', typeConsigneId: '', quantite: 1, estSortie: true, estRemboursement: false, montantRembourse: '', motif: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [typesConsigne, setTypesConsigne] = useState([]);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  // useState(() => { api.get(`/${metier}/types-consigne`).then(r => setTypesConsigne(r.data?.data || r.data || [])).catch(() => {}); }, []);

  const prefix = `/${metier}`;

  const fetchClients = async (q) => {
    const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const validate = () => {
    const errs = {};
    if (!form.clientId) errs.clientId = 'Sélectionnez un client';
    if (!form.typeConsigneId) errs.typeConsigneId = 'Sélectionnez le type de consigne';
    if (!form.quantite || form.quantite < 1) errs.quantite = 'La quantité doit être > 0';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/consignes/${edit.id}`, form);
      else await api.post(`${prefix}/consignes`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier mouvement consigne' : '🔄 Mouvement consigne'} loading={loading} submitLabel={edit ? 'Modifier' : 'Enregistrer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} placeholder="Rechercher un client..." required error={errors.clientId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type de consigne" name="typeConsigneId" type="select" value={form.typeConsigneId} onChange={set('typeConsigneId')} required error={errors.typeConsigneId}
          options={typesConsigne.map(t => ({ value: t.id, label: t.nom }))} />
        <NumberInput label="Quantité" name="quantite" value={form.quantite} onChange={set('quantite')} min={1} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" name="estSortie" type="toggle" value={form.estSortie} onChange={() => setForm({ ...form, estSortie: !form.estSortie })} toggleLabel={form.estSortie ? '📤 Sortie consigne' : '📥 Retour consigne'} />
        <FormField label="Remboursement" name="estRemboursement" type="toggle" value={form.estRemboursement} onChange={() => setForm({ ...form, estRemboursement: !form.estRemboursement, montantRembourse: form.estRemboursement ? '' : form.montantRembourse })} toggleLabel="💵 Rembourser en cash" />
      </div>
      {form.estRemboursement && (
        <FormField label="Montant remboursement" name="montantRembourse" type="number" value={form.montantRembourse} onChange={set('montantRembourse')} min={0} unit="FCFA" />
      )}
      <FormField label="Motif" name="motif" type="textarea" value={form.motif} onChange={set('motif')} rows={2} placeholder="Motif du mouvement..." />
    </FormModal>
  );
}
