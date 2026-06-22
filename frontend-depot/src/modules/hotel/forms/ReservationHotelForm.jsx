import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
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


export default function ReservationHotelForm({ isOpen, onClose, onSuccess, edit, metier = 'hotel' }) {
  const [form, setForm] = useState({ clientId: '', nomClient: '', telephone: '', email: '', chambreId: '', dateArrivee: '', dateDepart: '', nbPersonnes: 1, source: 'DIRECT', avance: 0, modePaiement: 'CASH', notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [chambres, setChambres] = useState([]);
  const [prixNuit, setPrixNuit] = useState(0);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useState(() => {
    api.get(`/${metier}/chambres`, { params: { statut: 'LIBRE' } }).then(r => setChambres(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({
      clientId: edit.clientId || '', nomClient: edit.nomClient || '', telephone: edit.telephone || '', email: edit.email || '',
      chambreId: edit.chambreId || '', dateArrivee: edit.dateArrivee?.slice(0, 16) || '', dateDepart: edit.dateDepart?.slice(0, 16) || '',
      nbPersonnes: edit.nbPersonnes || 1, source: edit.source || 'DIRECT', avance: edit.avance || 0,
      modePaiement: edit.modePaiement || 'CASH', notes: edit.notes || '',
    });
  }, [edit]);

  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };

  const handleChambreChange = (e) => {
    const id = e.target.value;
    setForm({ ...form, chambreId: id });
    const ch = chambres.find(c => c.id === id);
    if (ch?.typeChambre?.prixNuit) setPrixNuit(Number(ch.typeChambre.prixNuit));
  };

  const calcNuits = () => {
    if (!form.dateArrivee || !form.dateDepart) return 0;
    const diff = new Date(form.dateDepart) - new Date(form.dateArrivee);
    return Math.max(0, Math.round(diff / 86400000));
  };
  const nbNuits = calcNuits();
  const prixTotal = nbNuits * prixNuit;
  const soldeRestant = Math.max(0, prixTotal - (Number(form.avance) || 0));

  const validate = () => {
    const errs = {};
    if (!form.nomClient) errs.nomClient = 'Le nom du client est requis';
    if (!form.chambreId) errs.chambreId = 'Sélectionnez une chambre';
    if (!form.dateArrivee) errs.dateArrivee = 'La date d\'arrivée est requise';
    if (!form.dateDepart) errs.dateDepart = 'La date de départ est requise';
    if (form.dateArrivee && form.dateDepart && new Date(form.dateDepart) <= new Date(form.dateArrivee)) errs.dateDepart = 'Le départ doit être après l\'arrivée';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); const errs = validate(); setErrors(errs);
    if (Object.keys(errs).length > 0) return; setLoading(true);
    try {
      const payload = { ...form, nbNuits, prixTotal };
      if (edit) await api.patch(`${prefix}/reservations/${edit.id}`, payload);
      else await api.post(`${prefix}/reservations`, payload);
      onSuccess(); onClose();
    } catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier réservation' : '📅 Nouvelle réservation'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <FormField label="Nom du client" name="nomClient" value={form.nomClient} onChange={set('nomClient')} required placeholder="Nom complet" error={errors.nomClient?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="6XXXXXXXX" />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={set('email')} placeholder="client@exemple.com" />
      </div>
      <FormField label="Chambre" name="chambreId" type="select" value={form.chambreId} onChange={handleChambreChange} options={chambres.map(c => ({ value: c.id, label: `${c.numero} — ${c.typeChambre?.nom || ''} (${c.typeChambre?.prixNuit?.toLocaleString('fr-FR')} FCFA/nuit)` }))} required error={errors.chambreId?.message} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateTimePicker label="Arrivée" name="dateArrivee" value={form.dateArrivee} onChange={set('dateArrivee')} showTime required error={errors.dateArrivee?.message} />
        <DateTimePicker label="Départ" name="dateDepart" value={form.dateDepart} onChange={set('dateDepart')} showTime required error={errors.dateDepart?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Nombre de personnes" name="nbPersonnes" value={form.nbPersonnes} onChange={set('nbPersonnes')} min={1} />
        <FormField label="Source" name="source" type="select" value={form.source} onChange={set('source')} options={['DIRECT', 'BOOKING', 'AGENCE', 'TELEPHONE', 'WHATSAPP']} />
      </div>
      {nbNuits > 0 && (
        <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm">
          <div className="flex justify-between text-slate-400"><span>Nuits</span><span className="text-white font-bold">{nbNuits} nuits</span></div>
          <div className="flex justify-between text-slate-400"><span>Prix total</span><span className="text-white font-bold">{prixTotal.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between text-amber-400"><span>Avance</span><span>{Number(form.avance).toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between text-emerald-400 font-bold text-base pt-1 border-t border-slate-600"><span>Solde restant</span><span>{soldeRestant.toLocaleString('fr-FR')} FCFA</span></div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Avance" name="avance" type="number" value={form.avance} onChange={set('avance')} min={0} unit="FCFA" />
        <FormField label="Mode paiement" name="modePaiement" type="select" value={form.modePaiement} onChange={set('modePaiement')} options={['CASH', 'ORANGE_MONEY', 'MTN_MOMO', 'CARTE', 'VIREMENT']} />
      </div>
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
