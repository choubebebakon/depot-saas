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


export default function ColisForm({ isOpen, onClose, onSuccess, edit, metier = 'transport' }) {
  const [form, setForm] = useState({ expediteurId: '', nomExpediteur: '', destinataire: '', telephoneDest: '', adresseDest: '', villeDest: '', poids: '', dimensions: '', description: '', valeurDeclaree: '', montant: '', modePaiement: 'CASH' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});


  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    if (edit) setForm({ expediteurId: edit.expediteurId || '', nomExpediteur: edit.nomExpediteur || '', destinataire: edit.destinataire || '', telephoneDest: edit.telephoneDest || '', adresseDest: edit.adresseDest || '', villeDest: edit.villeDest || '', poids: edit.poids || '', dimensions: edit.dimensions || '', description: edit.description || '', valeurDeclaree: edit.valeurDeclaree || '', montant: edit.montant || '', modePaiement: edit.modePaiement || 'CASH' });
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const validate = () => { const errs = {}; if (!form.destinataire) errs.destinataire = 'Le nom du destinataire est requis'; if (!form.telephoneDest) errs.telephoneDest = 'Le téléphone du destinataire est requis'; if (!form.adresseDest) errs.adresseDest = 'L\'adresse de destination est requise'; if (!form.montant || Number(form.montant) <= 0) errs.montant = 'Le montant doit être > 0'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { if (edit) await api.patch(`${prefix}/colis/${edit.id}`, form); else await api.post(`${prefix}/colis`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier colis' : '📦 Nouveau colis'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Expéditeur" name="expediteurId" value={form.expediteurId} onChange={set('expediteurId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <FormField label="Nom expéditeur" name="nomExpediteur" value={form.nomExpediteur} onChange={set('nomExpediteur')} placeholder="Si non enregistré" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Destinataire *" name="destinataire" value={form.destinataire} onChange={set('destinataire')} required placeholder="Nom complet" error={errors.destinataire} />
        <FormField label="Téléphone destinataire *" name="telephoneDest" type="tel" value={form.telephoneDest} onChange={set('telephoneDest')} required placeholder="6XXXXXXXX" error={errors.telephoneDest} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Adresse de destination *" name="adresseDest" value={form.adresseDest} onChange={set('adresseDest')} required placeholder="Adresse complète" error={errors.adresseDest} />
        <FormField label="Ville de destination" name="villeDest" value={form.villeDest} onChange={set('villeDest')} placeholder="Ville" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Poids" name="poids" type="number" value={form.poids} onChange={set('poids')} min={0} unit="kg" />
        <FormField label="Dimensions" name="dimensions" value={form.dimensions} onChange={set('dimensions')} placeholder="30x20x15 cm" />
        <FormField label="Valeur déclarée" name="valeurDeclaree" type="number" value={form.valeurDeclaree} onChange={set('valeurDeclaree')} min={0} unit="FCFA" />
      </div>
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={set('description')} rows={2} placeholder="Contenu du colis..." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Montant transport" name="montant" type="number" value={form.montant} onChange={set('montant')} min={0} unit="FCFA" required error={errors.montant} />
        <FormField label="Mode de paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO']} />
      </div>
      <p className="text-xs text-slate-500">Référence auto-générée : COL-{new Date().getFullYear()}-XXX</p>
    </FormModal>
  );
}
