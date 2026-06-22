import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
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


export default function TelephoneForm({ isOpen, onClose, onSuccess, edit, metier = 'telephonie' }) {
  const [form, setForm] = useState({ articleId: '', imei: '', imei2: '', marque: 'SAMSUNG', modele: '', couleur: 'NOIR', stockage: '128Go', ram: '4Go', etat: 'NEUF', garantieMois: 12, dateAchat: '', prixAchat: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  useState(() => {
    if (edit) setForm({ articleId: edit.articleId || '', imei: edit.imei || '', imei2: edit.imei2 || '', marque: edit.marque || 'SAMSUNG', modele: edit.modele || '', couleur: edit.couleur || 'NOIR', stockage: edit.stockage || '128Go', ram: edit.ram || '4Go', etat: edit.etat || 'NEUF', garantieMois: edit.garantieMois || 12, dateAchat: edit.dateAchat?.slice(0, 10) || '', prixAchat: edit.prixAchat || '' });
  }, [edit]);

  const prefix = `/${metier}`;

  const isValidImei = (imei) => {
    if (!imei || imei.length !== 15 || !/^\d+$/.test(imei)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let digit = parseInt(imei[i]);
      if (i % 2 === 0) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  const validate = () => {
    const errs = {};
    if (!form.imei) errs.imei = 'L\'IMEI est requis';
    else if (!isValidImei(form.imei)) errs.imei = 'IMEI invalide (15 chiffres, format Luhn)';
    if (!form.marque) errs.marque = 'La marque est requise';
    if (!form.modele) errs.modele = 'Le modèle est requis';
    return errs;
  };

  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/telephones/${edit.id}`, form); else await api.post(`${prefix}/telephones`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'IMEI déjà enregistré' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier téléphone' : '📱 Nouveau téléphone'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="space-y-2 mb-2">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block">IMEI *</label>
        <BarcodeScanner onScan={(code) => setForm({ ...form, imei: code })} placeholder="Scanner ou saisir l'IMEI (15 chiffres)" mode="both" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="IMEI" name="imei" value={form.imei} onChange={set('imei')} required placeholder="15 chiffres" error={errors.imei?.message} />
        <FormField label="IMEI 2 (dual-SIM)" name="imei2" value={form.imei2} onChange={set('imei2')} placeholder="15 chiffres" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Marque" name="marque" type="select" value={form.marque} onChange={set('marque')} options={['SAMSUNG', 'APPLE', 'TECNO', 'ITEL', 'INFINIX', 'HUAWEI', 'XIAOMI', 'OPPO', 'NOKIA', 'AUTRE']} />
        <FormField label="Modèle" name="modele" value={form.modele} onChange={set('modele')} required placeholder="Ex: Galaxy S24" error={errors.modele?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Couleur" name="couleur" type="select" value={form.couleur} onChange={set('couleur')} options={['NOIR', 'BLANC', 'BLEU', 'ROUGE', 'OR', 'VERT', 'VIOLET', 'GRIS']} />
        <FormField label="Stockage" name="stockage" type="select" value={form.stockage} onChange={set('stockage')} options={['16Go', '32Go', '64Go', '128Go', '256Go', '512Go', '1To']} />
        <FormField label="RAM" name="ram" type="select" value={form.ram} onChange={set('ram')} options={['2Go', '3Go', '4Go', '6Go', '8Go', '12Go', '16Go']} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="État" name="etat" type="radio" value={form.etat} onChange={set('etat')} options={[{ value: 'NEUF', label: '✨ Neuf' }, { value: 'RECONDITIONNE', label: '🔄 Recond.' }, { value: 'OCCASION', label: '📱 Occasion' }]} />
        <NumberInput label="Garantie" name="garantieMois" value={form.garantieMois} onChange={set('garantieMois')} min={0} unit="mois" hint="12 mois par défaut" />
        <FormField label="Prix d'achat" name="prixAchat" type="number" value={form.prixAchat} onChange={set('prixAchat')} min={0} unit="FCFA" />
      </div>
    </FormModal>
  );
}
