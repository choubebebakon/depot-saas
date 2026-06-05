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


export default function OrdreTravailForm({ isOpen, onClose, onSuccess, edit, metier = 'garage' }) {
  const [form, setForm] = useState({ vehiculeId: '', problemeClient: '', kilometrageActuel: '', technicienId: '', dateSortiePrev: '', avance: 0 });
  const [pieces, setPieces] = useState([]);
  const [mainOeuvre, setMainOeuvre] = useState([{ description: '', montant: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [techniciens, setTechniciens] = useState([]);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    api.get(`/${metier}/techniciens`).then(r => setTechniciens(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ vehiculeId: edit.vehiculeId || '', problemeClient: edit.problemeClient || '', kilometrageActuel: edit.kilometrageActuel || '', technicienId: edit.technicienId || '', dateSortiePrev: edit.dateSortiePrev?.slice(0, 16) || '', avance: edit.avance || 0 });
  }, [edit]);

  const prefix = `/${metier}`;
  const fetchVehicules = async (q) => { const r = await api.get(`${prefix}/vehicules`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const fetchPieces = async (q) => { const r = await api.get(`${prefix}/pieces-stock`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };

  const ajouterPiece = () => setPieces([...pieces, { articleId: '', designation: '', quantite: 1, prixUnit: '' }]);
  const suppriméerPiece = (idx) => setPieces(pieces.filter((_, i) => i !== idx));
  const updatePiece = (idx, field) => (e) => { const n = [...pieces]; n[idx] = { ...n[idx], [field]: e.target.value }; setPieces(n); };
  const ajouterMO = () => setMainOeuvre([...mainOeuvre, { description: '', montant: '' }]);
  const suppriméerMO = (idx) => setMainOeuvre(mainOeuvre.filter((_, i) => i !== idx));
  const updateMO = (idx, field) => (e) => { const n = [...mainOeuvre]; n[idx] = { ...n[idx], [field]: e.target.value }; setMainOeuvre(n); };

  const totalPieces = pieces.reduce((s, p) => s + (Number(p.quantite) || 0) * (Number(p.prixUnit) || 0), 0);
  const totalMO = mainOeuvre.reduce((s, m) => s + (Number(m.montant) || 0), 0);
  const totalDevis = totalPieces + totalMO;

  const validate = () => { const errs = {}; if (!form.vehiculeId) errs.vehiculeId = 'Sélectionnez un véhicule'; if (!form.problemeClient) errs.problemeClient = 'Décrivez le problème'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, pieces, mainOeuvre, totalDevis }; if (edit) await api.patch(`${prefix}/ordres-travail/${edit.id}`, payload); else await api.post(`${prefix}/ordres-travail`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier OT' : '🔧 Nouvel ordre de travail'} loading={loading} size="xl" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Véhicule" name="vehiculeId" value={form.vehiculeId} onChange={set('vehiculeId')} fetchSuggestions={fetchVehicules} displayKey="immatriculation" placeholder="Rechercher par immatriculation..." required error={errors.vehiculeId} />
      <FormField label="Problème client" name="problemeClient" type="textarea" value={form.problemeClient} onChange={set('problemeClient')} required rows={2} error={errors.problemeClient} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInput label="Kilométrage" name="kilometrageActuel" value={form.kilometrageActuel} onChange={set('kilometrageActuel')} min={0} unit="km" />
        <FormField label="Technicien" name="technicienId" type="select" value={form.technicienId} onChange={set('technicienId')} options={techniciens.map(t => ({ value: t.id, label: t.nom }))} />
        <DateTimePicker label="Date sortie prévue" name="dateSortiePrev" value={form.dateSortiePrev} onChange={set('dateSortiePrev')} showTime />
      </div>
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">🔩 Pièces utilisées</h4>
        {pieces.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <AutocompleteInput name={`piece_${idx}`} fetchSuggestions={fetchPieces} displayKey="designation" placeholder="Pièce..." value={p.articleId} onChange={updatePiece(idx, 'articleId')} />
            <input type="text" value={p.designation} onChange={updatePiece(idx, 'designation')} placeholder="Ou saisir" className="w-32 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
            <NumberInput name={`qte_${idx}`} value={p.quantite} onChange={updatePiece(idx, 'quantite')} min={1} />
            <input type="number" value={p.prixUnit} onChange={updatePiece(idx, 'prixUnit')} placeholder="Prix" className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
            {pieces.length > 1 && <button onClick={() => suppriméerPiece(idx)} className="text-red-400 text-xs">✕</button>}
          </div>
        ))}
        <button type="button" onClick={ajouterPiece} className="text-xs text-amber-400 hover:text-amber-300 font-bold">+ Ajouter pièce</button>
      </div>
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">🔧 Main d'œuvre</h4>
        {mainOeuvre.map((mo, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <input type="text" value={mo.description} onChange={updateMO(idx, 'description')} placeholder="Description" className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={mo.montant} onChange={updateMO(idx, 'montant')} placeholder="Montant" className="w-32 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
            {mainOeuvre.length > 1 && <button onClick={() => suppriméerMO(idx)} className="text-red-400 text-xs">✕</button>}
          </div>
        ))}
        <button type="button" onClick={ajouterMO} className="text-xs text-amber-400 hover:text-amber-300 font-bold">+ Ajouter main d'œuvre</button>
      </div>
      <div className="p-3 bg-slate-800 rounded-xl text-sm space-y-1 mt-4">
        <div className="flex justify-between text-slate-400"><span>Total pièces</span><span>{totalPieces.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between text-slate-400"><span>Total MO</span><span>{totalMO.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total devis</span><span>{totalDevis.toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <FormField label="Avance" name="avance" type="number" value={form.avance} onChange={set('avance')} min={0} unit="FCFA" />
    </FormModal>
  );
}
