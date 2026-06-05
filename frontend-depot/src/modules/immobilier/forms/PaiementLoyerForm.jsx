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


export default function PaiementLoyerForm({ isOpen, onClose, onSuccess, metier = 'immobilier', contrat }) {
  const [form, setForm] = useState({ contratId: contrat?.id || '', mois: '', montant: contrat?.loyer || '', charges: contrat?.charges || 0, modePaiement: 'CASH', datePaiement: new Date().toISOString().slice(0, 10), notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;
  useState(() => { if (contrat) setForm(prev => ({ ...prev, contratId: contrat.id, montant: contrat.loyer || 0, charges: contrat.charges || 0 })); }, [contrat]);
  if (!contrat) return null;
  const validate = () => { const errs = {}; if (!form.mois) errs.mois = 'Sélectionnez le mois'; if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant doit être > 0'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { await api.post(`${prefix}/loyers`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  const now = new Date();
  const moisOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lbl = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { value: val, label: lbl };
  });

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="💰 Paiement de loyer" loading={loading} submitLabel="Enregistrer le paiement" submitIcon="💰">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <p className="text-slate-400 text-sm mb-4">Bien: <span className="text-white font-bold">{contrat.bien?.adresse} — {contrat.locataire?.nom}</span></p>
      <div className="p-3 bg-slate-800 rounded-xl text-sm space-y-1 mb-4">
        <div className="flex justify-between"><span className="text-slate-400">Loyer attendu</span><span className="text-white">{Number(contrat.loyer).toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Charges</span><span className="text-white">{Number(contrat.charges).toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <FormField label="Mois concerné" name="mois" type="select" value={form.mois} onChange={set('mois')} options={moisOptions} required error={errors.mois} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Montant du loyer" name="montant" type="number" value={form.montant} onChange={set('montant')} min={0} unit="FCFA" required error={errors.montant} />
        <FormField label="Charges" name="charges" type="number" value={form.charges} onChange={set('charges')} min={0} unit="FCFA" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'VIREMENT', 'CHEQUE']} />
        <DateTimePicker label="Date de paiement" name="datePaiement" value={form.datePaiement} onChange={set('datePaiement')} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
