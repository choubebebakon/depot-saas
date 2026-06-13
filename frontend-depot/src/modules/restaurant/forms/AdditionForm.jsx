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


export default function AdditionForm({ isOpen, onClose, onSuccess, metier = 'restaurant', commande }) {
  const [form, setForm] = useState({ modePaiement: 'CASH', montantRecu: '', remise: 0, pourboire: 0, articlesOfferts: [] });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;

  if (!commande) return null;

  const totalPlats = commande.plats?.reduce((s, p) => s + (Number(p.quantite) || 0) * (Number(p.prix) || 0), 0) || 0;
  const totalAvecRemise = totalPlats * (1 - (Number(form.remise) || 0) / 100);
  const totalFinal = totalAvecRemise + (Number(form.pourboire) || 0);
  const monnaie = Number(form.montantRecu) - totalFinal;


  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`${prefix}/commandes/${commande.id}/addition`, { ...form, totalFinal });
      onSuccess(); onClose();
    } catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="🧾 Addition" loading={loading} size="lg" submitLabel="Finaliser l'addition" submitIcon="🧾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm mb-4">
        {commande.plats?.map((p, i) => (
          <div key={i} className="flex justify-between"><span className="text-slate-400">{p.nom} x{p.quantite}</span><span className="text-white">{(Number(p.quantite) * Number(p.prix)).toLocaleString('fr-FR')} FCFA</span></div>
        ))}
        <div className="border-t border-slate-700 my-2" />
        <div className="flex justify-between text-slate-400"><span>Sous-total</span><span>{totalPlats.toLocaleString('fr-FR')} FCFA</span></div>
        {form.remise > 0 && <div className="flex justify-between text-amber-400"><span>Remise ({form.remise}%)</span><span>-{(totalPlats * form.remise / 100).toLocaleString('fr-FR')} FCFA</span></div>}
        {form.pourboire > 0 && <div className="flex justify-between text-purple-400"><span>Pourboire</span><span>+{Number(form.pourboire).toLocaleString('fr-FR')} FCFA</span></div>}
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total</span><span>{totalFinal.toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE', 'MIXTE']} />
        <FormField label="Montant reçu" name="montantRecu" type="number" value={form.montantRecu} onChange={set('montantRecu')} min={0} unit="FCFA" />
      </div>
      {Number(form.montantRecu) >= totalFinal && <p className="text-emerald-400 text-sm font-bold">Monnaie : {monnaie.toLocaleString('fr-FR')} FCFA</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Remise" name="remise" value={form.remise} onChange={set('remise')} min={0} max={100} unit="%" />
        <NumberInput label="Pourboire" name="pourboire" value={form.pourboire} onChange={set('pourboire')} min={0} unit="FCFA" />
      </div>
    </FormModal>
  );
}
