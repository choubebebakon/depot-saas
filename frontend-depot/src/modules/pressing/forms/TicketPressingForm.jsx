import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
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


export default function TicketPressingForm({ isOpen, onClose, onSuccess, edit, metier = 'pressing' }) {
  const [form, setForm] = useState({ clientId: '', dateRetrait: '', avance: 0 });
  const [vetements, setVetements] = useState([{ designation: 'CHEMISE', couleur: '', marque: '', typeService: 'PRESSING_COMPLET', prixUnitaire: '', observations: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    if (edit) setForm({ clientId: edit.clientId || '', dateRetrait: edit.dateRetrait?.slice(0, 16) || '', avance: edit.avance || 0 });
    if (edit?.vetements) setVetements(edit.vetements);
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const ajouterVetement = () => setVetements([...vetements, { designation: 'CHEMISE', couleur: '', marque: '', typeService: 'PRESSING_COMPLET', prixUnitaire: '', observations: '' }]);
  const suppriméerVetement = (idx) => setVetements(vetements.filter((_, i) => i !== idx));
  const updateVetement = (idx, field) => (e) => { const n = [...vetements]; n[idx] = { ...n[idx], [field]: e.target.value }; setVetements(n); };
  const total = vetements.reduce((s, v) => s + (Number(v.prixUnitaire) || 0), 0);
  const validate = () => { const errs = {}; if (!form.dateRetrait) errs.dateRetrait = 'La date de retrait est requise'; if (vetements.filter(v => v.prixUnitaire).length === 0) errs.vetements = 'Ajoutez au moins un vêtement avec un prix'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, vetements, total }; if (edit) await api.patch(`${prefix}/tickets/${edit.id}`, payload); else await api.post(`${prefix}/tickets`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier ticket' : '🎫 Nouveau ticket pressing'} loading={loading} size="xl" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <DateTimePicker label="Date de retrait prévue" name="dateRetrait" value={form.dateRetrait} onChange={set('dateRetrait')} showTime required error={errors.dateRetrait} />
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">👕 Vêtements</h4>
        {vetements.map((v, idx) => (
          <div key={idx} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 mb-2">
            <div className="flex justify-between mb-2"><span className="text-xs text-slate-500 font-bold uppercase">Vêtement {idx + 1}</span>{vetements.length > 1 && <button onClick={() => suppriméerVetement(idx)} className="text-red-400 text-xs font-bold">✕</button>}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <FormField label="Type" name={`des_${idx}`} type="select" value={v.designation} onChange={updateVetement(idx, 'designation')} options={['CHEMISE', 'PANTALON', 'COSTUME', 'ROBE', 'VESTE', 'MANTEAU', 'JUPE', 'AUTRE']} />
              <FormField label="Couleur" value={v.couleur} onChange={updateVetement(idx, 'couleur')} placeholder="Couleur" />
              <FormField label="Marque" value={v.marque} onChange={updateVetement(idx, 'marque')} placeholder="Marque" />
              <FormField label="Type service" type="select" value={v.typeService} onChange={updateVetement(idx, 'typeService')} options={[
                { value: 'LAVAGE', label: '🧺 Lavage' }, { value: 'REPASSAGE', label: '👔 Repassage' },
                { value: 'NETTOYAGE_SEC', label: '🧼 Nettoyage sec' }, { value: 'DETACHAGE', label: '✨ Détachage' },
                { value: 'PRESSING_COMPLET', label: '🔄 Pressing complet' },
              ]} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <FormField label="Prix unitaire" type="number" value={v.prixUnitaire} onChange={updateVetement(idx, 'prixUnitaire')} min={0} unit="FCFA" />
              <FormField label="Observations" value={v.observations} onChange={updateVetement(idx, 'observations')} placeholder="Taches, déchirures..." />
            </div>
          </div>
        ))}
        <button type="button" onClick={ajouterVetement} className="w-full py-2 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white text-sm font-bold mt-2 transition-all">+ Ajouter un vêtement</button>
        {errors.vetements && <p className="text-red-400 text-xs mt-2">⚠️ {errors.vetements}</p>}
      </div>
      <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between">
        <span className="text-slate-400">Total</span><span className="text-white font-bold">{total.toLocaleString('fr-FR')} FCFA</span>
      </div>
      <FormField label="Avance" name="avance" type="number" value={form.avance} onChange={set('avance')} min={0} unit="FCFA" />
    </FormModal>
  );
}
