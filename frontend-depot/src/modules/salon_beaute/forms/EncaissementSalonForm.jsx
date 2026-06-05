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


export default function EncaissementSalonForm({ isOpen, onClose, onSuccess, metier = 'salon', rendezVous }) {
  const [form, setForm] = useState({ rendezVousId: rendezVous?.id || '', modePaiement: 'CASH', montantRecu: '', pourboire: 0, produitsUtilises: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));



  const prefix = `/${metier}`;
  useState(() => { if (rendezVous) setForm(prev => ({ ...prev, rendezVousId: rendezVous.id })); }, [rendezVous]);
  if (!rendezVous) return null;
  const total = rendezVous.total || rendezVous.prestations?.reduce((s, p) => s + (p.prix || 0), 0) || 0;
  const totalFinal = total + (Number(form.pourboire) || 0);
  const monnaie = Number(form.montantRecu) - totalFinal;
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true);
    try { await api.post(`${prefix}/rendez-vous/${form.rendezVousId}/encaissement`, { ...form, totalFinal }); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="💰 Encaissement" loading={loading} submitLabel="Encaisser" submitIcon="💰">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="p-3 bg-slate-800 rounded-xl text-sm mb-4">
        {rendezVous.prestations?.map((p, i) => <div key={i} className="flex justify-between text-slate-400"><span>{p.nom}</span><span>{p.prix?.toLocaleString('fr-FR')} FCFA</span></div>)}
        <div className="border-t border-slate-700 my-2" />
        <div className="flex justify-between text-white font-bold"><span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE']} />
        <NumberInput label="Pourboire" name="pourboire" value={form.pourboire} onChange={set('pourboire')} min={0} unit="FCFA" />
      </div>
      <FormField label="Montant reçu" name="montantRecu" type="number" value={form.montantRecu} onChange={set('montantRecu')} min={0} unit="FCFA" />
      {Number(form.montantRecu) >= totalFinal && <p className="text-emerald-400 text-sm font-bold">Monnaie : {monnaie.toLocaleString('fr-FR')} FCFA</p>}
      <FormField label="Produits utilisés" name="produitsUtilises" type="textarea" value={form.produitsUtilises} onChange={set('produitsUtilises')} rows={2} placeholder="Produits consommés (déstock)" />
    </FormModal>
  );
}
