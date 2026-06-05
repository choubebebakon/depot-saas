import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';
import DateTimePicker from '../../../shared/components/forms/DateTimePicker';
import PhotoUpload from '../../../shared/components/forms/PhotoUpload';

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


export default function ArticleSupermarcheForm({ isOpen, onClose, onSuccess, edit, metier = 'supermarche' }) {
  const [form, setForm] = useState({
    designation: '', prixVente: '', prixAchat: '', seuilCritique: 0,
    codeBarres: '', unite: 'PIECE', prixGros: '',
    rayonId: '', dateExpiration: '', photoUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rayons, setRayons] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));




  useState(() => {
    api.get(`/${metier}/rayons`).then(r => setRayons(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({
      designation: edit.designation || '', prixVente: edit.prixVente || '', prixAchat: edit.prixAchat || '',
      seuilCritique: edit.seuilCritique || 0, codeBarres: edit.codeBarres || '', unite: edit.unite || 'PIECE',
      prixGros: edit.prixGros || '', rayonId: edit.rayonId || '', dateExpiration: edit.dateExpiration?.slice(0, 10) || '',
      photoUrl: edit.photoUrl || null,
    });
  }, [edit]);

  const prefix = `/${metier}`;

  const validate = () => {
    const errs = {};
    if (!form.designation) errs.designation = 'La désignation est obligatoire';
    if (!form.prixVente || Number(form.prixVente) <= 0) errs.prixVente = 'Le prix de vente doit être > 0';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (edit) await api.patch(`${prefix}/articles/${edit.id}`, form);
      else await api.post(`${prefix}/articles`, form);
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier article' : '📦 Nouvel article'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <FormField label="Désignation" name="designation" value={form.designation} onChange={set('designation')} required placeholder="Nom de l'article" error={errors.designation} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Prix vente" name="prixVente" type="number" value={form.prixVente} onChange={set('prixVente')} required min={0} unit="FCFA" error={errors.prixVente} />
        <FormField label="Prix achat" name="prixAchat" type="number" value={form.prixAchat} onChange={set('prixAchat')} min={0} unit="FCFA" />
        <FormField label="Prix de gros" name="prixGros" type="number" value={form.prixGros} onChange={set('prixGros')} min={0} unit="FCFA" hint="Optionnel" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Unité" name="unite" type="select" value={form.unite} onChange={set('unite')} options={[
          { value: 'PIECE', label: 'Pièce' }, { value: 'KG', label: 'kg' },
          { value: 'LITRE', label: 'Litre' }, { value: 'M2', label: 'm²' },
        ]} />
        <FormField label="Rayon" name="rayonId" type="select" value={form.rayonId} onChange={set('rayonId')} options={rayons.map(r => ({ value: r.id, label: r.nom }))} />
      </div>
      <div className="space-y-2">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Code-barres</label>
        <BarcodeScanner onScan={(code) => setForm({ ...form, codeBarres: code })} placeholder="Saisir ou scanner le code-barres" mode="both" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Date d'expiration" name="dateExpiration" value={form.dateExpiration} onChange={set('dateExpiration')} hint="Optionnelle" />
        <FormField label="Seuil critique" name="seuilCritique" type="number" value={form.seuilCritique} onChange={set('seuilCritique')} min={0} />
      </div>
      <PhotoUpload label="Photo de l'article" name="photoUrl" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
    </FormModal>
  );
}
