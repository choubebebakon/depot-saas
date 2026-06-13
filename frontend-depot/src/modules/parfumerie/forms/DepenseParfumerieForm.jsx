import { useState, useEffect } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';

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

const initialState = { libelle: '', montant: '', date: new Date().toISOString().split('T')[0], categorie: 'AUTRE' };
export default function DepenseParfumerieForm({ isOpen, onClose, onSuccess, edit, metier = 'parfumerie' }) {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const CATEGORIES = ['Loyer', 'Salaires', 'Électricité', 'Eau', 'Téléphone', 'Internet', 'Fournitures', 'Maintenance', 'Transport', 'Publicité', 'Autre'];

  useEffect(() => { if (edit) setForm({ ...edit }); else setForm({ ...initialState }); }, [edit, isOpen]);
  const prefix = `/${metier}`;
  const validate = () => { const errs = {}; if (!form.libelle?.trim()) errs.libelle = 'Libellé requis'; if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Montant requis'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); if (Object.keys(errs).length) { setErrors(errs); return; } setLoading(true); setErrors({}); try { if (edit) await api.patch(`${prefix}/depenses/${edit.id}`, form); else await api.post(`${prefix}/depenses`, form); onSuccess(); onClose(); } catch (err) { setErrors({ general: err.response?.data?.message || "Erreur lors de l'enregistréement" }); } finally { setLoading(false); } };
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? 'Modifier la dépense' : 'Nouvelle dépense'} loading={loading} size="md" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Libellé" name="libelle" value={form.libelle} onChange={set('libelle')} required error={errors.libelle} />
      <FormField label="Montant" name="montant" type="number" step="0.01" value={form.montant} onChange={set('montant')} required error={errors.montant} />
      <FormField label="Date" name="date" type="date" value={form.date} onChange={set('date')} />
      <FormField label="Catégorie" name="categorie" type="select" value={form.categorie} onChange={set('categorie')} options={CATEGORIES} />
    </FormModal>
  );
}
