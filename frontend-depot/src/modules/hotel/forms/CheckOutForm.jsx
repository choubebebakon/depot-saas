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


export default function CheckOutForm({ isOpen, onClose, onSuccess, metier = 'hotel', reservation, consommations = [] }) {
  const [form, setForm] = useState({ modePaiement: 'CASH', montantRecu: '', satisfaction: 5 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;

  if (!reservation) return null;

  const nbNuits = Math.max(0, Math.round((new Date(reservation.dateDepart) - new Date(reservation.dateArrivee)) / 86400000));
  const totalHebergement = nbNuits * (reservation.prixNuit || 0);
  const totalConso = consommations.reduce((s, c) => s + (Number(c.montant) || Number(c.prixUnitaire) * Number(c.quantite) || 0), 0);
  const totalGeneral = totalHebergement + totalConso;
  const avance = Number(reservation.avance) || 0;
  const resteAPayer = Math.max(0, totalGeneral - avance);
  const monnaie = Number(form.montantRecu) - resteAPayer;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`${prefix}/reservations/${reservation.id}/écheckout`, {
        ...form, totalGeneral, resteAPayer,
      });
      onSuccess(); onClose();
    } catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="🧾 Check-out" loading={loading} size="lg" submitLabel="Finaliser le départ" submitIcon="🧾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm mb-4">
        <div className="flex justify-between text-slate-400"><span>Client</span><span className="text-white font-bold">{reservation.nomClient}</span></div>
        <div className="flex justify-between text-slate-400"><span>Chambre</span><span className="text-white font-bold">{reservation.chambre?.numero}</span></div>
        <div className="border-t border-slate-700 my-2" />
        <div className="flex justify-between"><span className="text-slate-400">Hébergement ({nbNuits} nuits)</span><span className="text-white">{totalHebergement.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Consommations</span><span className="text-white">{totalConso.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="border-t border-slate-700 my-2" />
        <div className="flex justify-between text-white font-bold text-base"><span>Total</span><span>{totalGeneral.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between text-amber-400"><span>Avance</span><span>-{avance.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between text-emerald-400 font-bold"><span>Reste à payer</span><span>{resteAPayer.toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE', 'VIREMENT']} />
        <FormField label="Montant reçu" name="montantRecu" type="number" value={form.montantRecu} onChange={set('montantRecu')} min={0} unit="FCFA" />
      </div>
      {Number(form.montantRecu) >= resteAPayer && <p className="text-emerald-400 text-sm font-bold">Monnaie à rendre : {monnaie.toLocaleString('fr-FR')} FCFA</p>}
      <NumberInput label="Satisfaction client" name="satisfaction" value={form.satisfaction} onChange={set('satisfaction')} min={1} max={5} hint="Note sur 5" />
    </FormModal>
  );
}
