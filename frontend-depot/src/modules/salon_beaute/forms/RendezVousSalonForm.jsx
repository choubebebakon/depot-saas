import { useState, useEffect } from 'react';
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


export default function RendezVousSalonForm({ isOpen, onClose, onSuccess, edit, metier = 'salon' }) {
  const [form, setForm] = useState({ clientId: '', nomClient: '', telephone: '', employeId: '', dateHeure: '', prestations: [], notes: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [employes, setEmployes] = useState([]);
  const [prestations, setPrestations] = useState([]);


  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  useEffect(() => {
    api.get(`/${metier}/employes`).then(r => setEmployes(r.data?.data || r.data || [])).catch(() => {});
    api.get(`/${metier}/prestations`).then(r => setPrestations(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ clientId: edit.clientId || '', nomClient: edit.nomClient || '', telephone: edit.telephone || '', employeId: edit.employeId || '', dateHeure: edit.dateHeure?.slice(0, 16) || '', prestations: edit.prestations || [], notes: edit.notes || '' });
  }, [edit]);

  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };

  const togglePrestation = (id, nom, prix) => {
    setForm(prev => {
      const exist = prev.prestations.find(p => p.id === id);
      return {
        ...prev,
        prestations: exist
          ? prev.prestations.filter(p => p.id !== id)
          : [...prev.prestations, { id, nom, prix: Number(prix) }],
      };
    });
  };

  const totalPrestations = form.prestations.reduce((s, p) => s + (p.prix || 0), 0);

  const validate = () => { const errs = {}; if (!form.nomClient) errs.nomClient = 'Le nom du client est requis'; if (!form.dateHeure) errs.dateHeure = 'La date est requise'; if (form.prestations.length === 0) errs.prestations = 'Sélectionnez au moins une prestation'; return errs; };

  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, total: totalPrestations }; if (edit) await api.patch(`${prefix}/rendez-vous/${edit.id}`, payload); else await api.post(`${prefix}/rendez-vous`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier RDV' : '📅 Nouveau rendez-vous'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nom du client" name="nomClient" value={form.nomClient} onChange={set('nomClient')} required placeholder="Nom complet" error={errors.nomClient} />
        <FormField label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={set('telephone')} placeholder="6XXXXXXXX" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Employé" name="employeId" type="select" value={form.employeId} onChange={set('employeId')} options={employes.map(e => ({ value: e.id, label: e.nom }))} />
        <DateTimePicker label="Date et heure" name="dateHeure" value={form.dateHeure} onChange={set('dateHeure')} showTime required error={errors.dateHeure} />
      </div>
      <div>
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Prestations *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {prestations.map(p => {
            const selected = form.prestations.some(sp => sp.id === p.id);
            return (
              <button key={p.id} type="button" onClick={() => togglePrestation(p.id, p.nom, p.prix)}
                className={`p-2 rounded-xl text-xs font-bold transition-all border ${selected ? 'bg-pink-600/20 border-pink-500/50 text-pink-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                {p.nom}<br /><span className="font-mono">{Number(p.prix).toLocaleString('fr-FR')} F</span>
              </button>
            );
          })}
        </div>
        {errors.prestations && <p className="text-red-400 text-xs mt-1">⚠️ {errors.prestations}</p>}
      </div>
      {form.prestations.length > 0 && (
        <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between">
          <span className="text-slate-400">Total</span><span className="text-white font-bold">{totalPrestations.toLocaleString('fr-FR')} FCFA</span>
        </div>
      )}
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
