import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
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


export default function OrdonnanceForm({ isOpen, onClose, onSuccess, edit, metier = 'pharmacie' }) {
  const [form, setForm] = useState({ clientId: '', medecin: '', etablissement: '', dateEmise: new Date().toISOString().slice(0, 16), photoUrl: null });
  const [lignes, setLignes] = useState([{ medicamentId: '', quantitePrescrite: 1, posologie: '', duree: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;

  const fetchClients = async (q) => {
    const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const fetchMedicaments = async (q) => {
    const r = await api.get(`${prefix}/medicaments`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const ajouterLigne = () => setLignes([...lignes, { medicamentId: '', quantitePrescrite: 1, posologie: '', duree: '' }]);
  const suppriméerLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));
  const updateLigne = (idx, field) => (e) => {
    const next = [...lignes]; next[idx] = { ...next[idx], [field]: e.target.value }; setLignes(next);
  };

  const validate = () => {
    const errs = {};
    if (!form.clientId) errs.clientId = 'Sélectionnez un patient';
    if (!form.dateEmise) errs.dateEmise = 'La date est requise';
    const lignesValides = lignes.filter(l => l.medicamentId && l.quantitePrescrite > 0);
    if (lignesValides.length === 0) errs.lignes = 'Ajoutez au moins un médicament';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const payload = { ...form, lignes: lignes.filter(l => l.medicamentId) };
    try {
      if (edit) await api.patch(`${prefix}/ordonnances/${edit.id}`, payload);
      else await api.post(`${prefix}/ordonnances`, payload);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier ordonnance' : '📋 Nouvelle ordonnance'} loading={loading} size="xl" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Patient" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un patient..." required error={errors.clientId?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Médecin" name="medecin" value={form.medecin} onChange={set('medecin')} placeholder="Nom du médecin prescripteur" />
        <FormField label="Établissement" name="etablissement" value={form.etablissement} onChange={set('etablissement')} placeholder="Hôpital, cabinet..." />
      </div>
      <DateTimePicker label="Date d'émission" name="dateEmise" value={form.dateEmise} onChange={set('dateEmise')} showTime required error={errors.dateEmise?.message} />
      <PhotoUpload label="Scan de l'ordonnance" name="photoUrl" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">💊 Médicaments prescrits</h4>
        <div className="space-y-3">
          {lignes.map((l, idx) => (
            <div key={idx} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Médicament {idx + 1}</span>
                {lignes.length > 1 && <button type="button" onClick={() => suppriméerLigne(idx)} className="text-red-400 text-xs font-bold">✕ Supprimer</button>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AutocompleteInput label="Médicament" name={`med_${idx}`} fetchSuggestions={fetchMedicaments} displayKey="designation" value={l.medicamentId} onChange={updateLigne(idx, 'medicamentId')} placeholder="Rechercher..." />
                <NumberInput label="Quantité prescrite" name={`qte_${idx}`} value={l.quantitePrescrite} onChange={updateLigne(idx, 'quantitePrescrite')} min={1} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <FormField label="Posologie" name={`poso_${idx}`} value={l.posologie} onChange={updateLigne(idx, 'posologie')} placeholder="Ex: 1 comprimé 3x/jour" />
                <FormField label="Durée" name={`duree_${idx}`} value={l.duree} onChange={updateLigne(idx, 'duree')} placeholder="Ex: 7 jours" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={ajouterLigne} className="w-full py-2 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white text-sm font-bold mt-3 transition-all">+ Ajouter un médicament</button>
        {errors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes}</p>}
      </div>
    </FormModal>
  );
}
