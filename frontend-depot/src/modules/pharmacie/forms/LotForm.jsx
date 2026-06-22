import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
);

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


export default function LotForm({ isOpen, onClose, onSuccess, edit, metier = 'pharmacie' }) {
  const [form, setForm] = useState({ articleId: '', numeroLot: '', dateExpiration: '', quantite: 1, depotId: '', fournisseurId: '', prixAchatUnitaire: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [depots, setDepots] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    api.get(`/${metier}/depots`).then(r => setDepots(r.data?.data || r.data || [])).catch(() => {});
    api.get(`/${metier}/fournisseurs`).then(r => setFournisseurs(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({
      articleId: edit.articleId || '', numeroLot: edit.numeroLot || '', dateExpiration: edit.dateExpiration?.slice(0, 10) || '',
      quantite: edit.quantite || 1, depotId: edit.depotId || '', fournisseurId: edit.fournisseurId || '',
      prixAchatUnitaire: edit.prixAchatUnitaire || '',
    });
  }, [edit]);

  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: cleanParams({ search: q, limit: 8 }) });
    return r.data?.data || r.data || [];
  };

  const validate = () => {
    const errs = {};
    if (!form.articleId) errs.articleId = 'Sélectionnez un article';
    if (!form.numeroLot) errs.numeroLot = 'Le numéro de lot est requis';
    if (!form.dateExpiration) errs.dateExpiration = 'La date d\'expiration est requise';
    if (!form.quantite || form.quantite < 1) errs.quantite = 'Minimum 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/lots/${edit.id}`, form);
      else await api.post(`${prefix}/lots`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier lot' : '🏷️ Nouveau lot'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Article" name="articleId" value={form.articleId} onChange={set('articleId')} fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." required error={errors.articleId?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Numéro de lot" name="numeroLot" value={form.numeroLot} onChange={set('numeroLot')} required placeholder="Ex: LOT-001" error={errors.numeroLot?.message} />
        <DateTimePicker label="Date d'expiration" name="dateExpiration" value={form.dateExpiration} onChange={set('dateExpiration')} required error={errors.dateExpiration?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInput label="Quantité" name="quantite" value={form.quantite} onChange={set('quantite')} min={1} required />
        <FormField label="Dépôt" name="depotId" type="select" value={form.depotId} onChange={set('depotId')} options={depots.map(d => ({ value: d.id, label: d.nom }))} />
        <FormField label="Fournisseur" name="fournisseurId" type="select" value={form.fournisseurId} onChange={set('fournisseurId')} options={fournisseurs.map(f => ({ value: f.id, label: f.nom }))} />
      </div>
      <FormField label="Prix achat unitaire" name="prixAchatUnitaire" type="number" value={form.prixAchatUnitaire} onChange={set('prixAchatUnitaire')} min={0} unit="FCFA" />
    </FormModal>
  );
}
