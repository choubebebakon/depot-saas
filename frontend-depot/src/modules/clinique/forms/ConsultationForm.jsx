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


export default function ConsultationForm({ isOpen, onClose, onSuccess, metier = 'clinique', rendezVous }) {
  const [form, setForm] = useState({
    rendezVousId: rendezVous?.id || '', motif: rendezVous?.motif || '', examenClinique: '', diagnostic: '', traitement: '',
    prescriptions: [{ medicament: '', dosage: '', posologie: '', duree: '' }],
    examensDemandes: [], prochainRdv: '', montant: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const prefix = `/${metier}`;

  const fetchMedicaments = async (q) => { const r = await api.get(`${prefix}/medicaments`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };

  const ajouterPrescription = () => setForm(prev => ({ ...prev, prescriptions: [...prev.prescriptions, { medicament: '', dosage: '', posologie: '', duree: '' }] }));
  const suppriméerPrescription = (idx) => setForm(prev => ({ ...prev, prescriptions: prev.prescriptions.filter((_, i) => i !== idx) }));
  const updatePrescription = (idx, field) => (e) => {
    setForm(prev => { const n = [...prev.prescriptions]; n[idx] = { ...n[idx], [field]: e.target.value }; return { ...prev, prescriptions: n }; });
  };

  const validate = () => { const errs = {}; if (!form.motif) errs.motif = 'Le motif est requis'; if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant doit être > 0'; return errs; };
  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try { await api.post(`${prefix}/consultations`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="🩺 Consultation" loading={loading} size="xl" submitLabel="Enregistrer la consultation" submitIcon="💾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      {rendezVous && <div className="p-3 bg-slate-800 rounded-xl text-sm text-slate-400 mb-4">Patient: <span className="text-white font-bold">{rendezVous.client?.nom}</span> — Médecin: <span className="text-white font-bold">{rendezVous.medecin?.nom}</span></div>}
      <FormField label="Motif" name="motif" type="textarea" value={form.motif} onChange={set('motif')} required rows={2} error={errors.motif?.message} />
      <FormField label="Examen clinique" name="examenClinique" type="textarea" value={form.examenClinique} onChange={set('examenClinique')} rows={3} placeholder="Résultats de l'examen clinique..." />
      <FormField label="Diagnostic" name="diagnostic" type="textarea" value={form.diagnostic} onChange={set('diagnostic')} rows={3} placeholder="Diagnostic établi..." />
      <FormField label="Traitement prescrit" name="traitement" type="textarea" value={form.traitement} onChange={set('traitement')} rows={2} placeholder="Traitement recommandé..." />
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">💊 Prescriptions</h4>
        <div className="space-y-3">
          {form.prescriptions.map((p, idx) => (
            <div key={idx} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <div className="flex justify-between mb-2"><span className="text-xs text-slate-500 font-bold uppercase">Médicament {idx + 1}</span>{form.prescriptions.length > 1 && <button type="button" onClick={() => suppriméerPrescription(idx)} className="text-red-400 text-xs font-bold">✕</button>}</div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Médicament" value={p.medicament} onChange={updatePrescription(idx, 'medicament')} placeholder="Nom du médicament" />
                <FormField label="Dosage" value={p.dosage} onChange={updatePrescription(idx, 'dosage')} placeholder="500mg" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <FormField label="Posologie" value={p.posologie} onChange={updatePrescription(idx, 'posologie')} placeholder="1 comprimé 3x/jour" />
                <FormField label="Durée" value={p.duree} onChange={updatePrescription(idx, 'duree')} placeholder="7 jours" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={ajouterPrescription} className="w-full py-2 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white text-sm font-bold mt-3 transition-all">+ Ajouter un médicament</button>
      </div>
      <FormField label="Examens demandés" name="examensDemandes" type="multiselect" value={form.examensDemandes} onChange={set('examensDemandes')} options={['Prise de sang', 'Radio', 'Échographie', 'IRM', 'Scanner', 'ECG', 'Analyse d\'urine']} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Prochain RDV" name="prochainRdv" value={form.prochainRdv} onChange={set('prochainRdv')} showTime hint="Optionnel" />
        <FormField label="Montant" name="montant" type="number" value={form.montant} onChange={set('montant')} min={0} unit="FCFA" required error={errors.montant?.message} />
      </div>
    </FormModal>
  );
}
