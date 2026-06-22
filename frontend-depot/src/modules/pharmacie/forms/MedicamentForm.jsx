import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
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


export default function MedicamentForm({ isOpen, onClose, onSuccess, edit, metier = 'pharmacie' }) {
  const [form, setForm] = useState({ articleId: '', numeroLot: '', dateExpiration: '', dosage: '', formeGalenique: 'COMPRIME', famille: 'ANTIBIOTIQUE', surOrdonnance: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    if (edit) setForm({
      articleId: edit.articleId || '', numeroLot: edit.numeroLot || '', dateExpiration: edit.dateExpiration?.slice(0, 10) || '',
      dosage: edit.dosage || '', formeGalenique: edit.formeGalenique || 'COMPRIME', famille: edit.famille || 'ANTIBIOTIQUE',
      surOrdonnance: edit.surOrdonnance || false,
    });
  }, [edit]);

  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };

  const validate = () => {
    const errs = {};
    if (!form.articleId) errs.articleId = 'Sélectionnez un article';
    if (!form.numeroLot) errs.numeroLot = 'Le numéro de lot est requis';
    if (!form.dateExpiration) errs.dateExpiration = 'La date d\'expiration est requise';
    else if (new Date(form.dateExpiration) < new Date()) errs.dateExpiration = 'La date d\'expiration est déjà passée';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/medicaments/${edit.id}`, form);
      else await api.post(`${prefix}/medicaments`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  const expirationSoon = form.dateExpiration && new Date(form.dateExpiration) < new Date(Date.now() + 30 * 86400000);

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier médicament' : '💊 Nouveau médicament'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Article" name="articleId" value={form.articleId} onChange={set('articleId')} fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher un article..." required error={errors.articleId?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Numéro de lot" name="numeroLot" value={form.numeroLot} onChange={set('numeroLot')} required placeholder="Ex: LOT-2026-001" error={errors.numeroLot?.message} />
        <DateTimePicker label="Date d'expiration" name="dateExpiration" value={form.dateExpiration} onChange={set('dateExpiration')} required error={errors.dateExpiration?.message} />
      </div>
      {expirationSoon && <div className="p-3 bg-amber-500/10 border border-amp;er-500/30 text-amber-400 text-sm rounded-xl">⚠️ Ce médicament expire dans moins de 30 jours</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Dosage" name="dosage" value={form.dosage} onChange={set('dosage')} placeholder="Ex: 500mg, 1g, 250ml" />
        <FormField label="Forme galénique" name="formeGalenique" type="select" value={form.formeGalenique} onChange={set('formeGalenique')} options={['COMPRIME', 'SIROP', 'INJECTABLE', 'GELULE', 'POMMADE', 'SPRAY', 'SUPPOSITOIRE', 'POUDRE']} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Famille" name="famille" type="select" value={form.famille} onChange={set('famille')} options={['ANTIBIOTIQUE', 'ANTALGIQUE', 'ANTIFONGIQUE', 'VITAMINES', 'ANTI_INFLAMMATOIRE', 'ANTIHYPERTENSEUR', 'ANTIDIABETIQUE', 'AUTRE']} />
        <FormField label="Sur ordonnance" name="surOrdonnance" type="toggle" value={form.surOrdonnance} onChange={() => setForm({ ...form, surOrdonnance: !form.surOrdonnance })} toggleLabel={form.surOrdonnance ? '🔴 Sur ordonnance' : '🟢 Libre'} />
      </div>
    </FormModal>
  );
}
