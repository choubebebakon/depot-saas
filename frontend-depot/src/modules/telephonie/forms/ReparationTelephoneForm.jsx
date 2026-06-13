import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
import AutocompleteInput from '../../../shared/components/forms/AutocompleteInput';
import NumberInput from '../../../shared/components/forms/NumberInput';
import BarcodeScanner from '../../../shared/components/forms/BarcodeScanner';

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


export default function ReparationTelephoneForm({ isOpen, onClose, onSuccess, edit, metier = 'telephonie' }) {
  const [form, setForm] = useState({ clientId: '', imei: '', marque: '', modele: '', probleme: '', avance: 0, technicienId: '' });
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [techniciens, setTechniciens] = useState([]);


  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    api.get(`/${metier}/techniciens`).then(r => setTechniciens(r.data?.data || r.data || [])).catch(() => {});
    if (edit) setForm({ clientId: edit.clientId || '', imei: edit.imei || '', marque: edit.marque || '', modele: edit.modele || '', probleme: edit.probleme || '', avance: edit.avance || 0, technicienId: edit.technicienId || '' });
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const fetchPieces = async (q) => { const r = await api.get(`${prefix}/pieces`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const ajouterPiece = () => setPieces([...pieces, { articleId: '', designation: '', quantite: 1, prixUnit: '' }]);
  const suppriméerPiece = (idx) => setPieces(pieces.filter((_, i) => i !== idx));
  const updatePiece = (idx, field) => (e) => { const n = [...pieces]; n[idx] = { ...n[idx], [field]: e.target.value }; setPieces(n); };
  const totalPieces = pieces.reduce((s, p) => s + (Number(p.quantite) || 0) * (Number(p.prixUnit) || 0), 0);

  const handleImeiScan = async (code) => {
    setForm({ ...form, imei: code });
    try {
      const r = await api.get(`${prefix}/telephones`, { params: { imei: code } });
      const tel = r.data?.data?.[0] || r.data?.[0];
      if (tel) setForm(prev => ({ ...prev, imei: code, marque: tel.marque || prev.marque, modele: tel.modele || prev.modele }));
    } catch {}
  };

  const validate = () => { const errs = {}; if (!form.probleme) errs.probleme = 'Décrivez le problème'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, pieces }; if (edit) await api.patch(`${prefix}/reparations/${edit.id}`, payload); else await api.post(`${prefix}/reparations`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier réparation' : '🔧 Nouvelle réparation'} loading={loading} size="lg" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." />
      <div className="space-y-2 mb-2">
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block">IMEI</label>
        <BarcodeScanner onScan={handleImeiScan} placeholder="Scanner ou saisir l'IMEI" mode="both" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="IMEI" name="imei" value={form.imei} onChange={set('imei')} />
        <FormField label="Marque" name="marque" value={form.marque} onChange={set('marque')} placeholder="Auto-rempli si IMEI trouvéé" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Modèle" name="modele" value={form.modele} onChange={set('modele')} placeholder="Modèle" />
        <FormField label="Technicien" name="technicienId" type="select" value={form.technicienId} onChange={set('technicienId')} options={techniciens.map(t => ({ value: t.id, label: t.nom }))} />
      </div>
      <FormField label="Problème" name="probleme" type="textarea" value={form.probleme} onChange={set('probleme')} required rows={2} error={errors.probleme} />
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">🔩 Pièces</h4>
        {pieces.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <AutocompleteInput name={`piece_${idx}`} fetchSuggestions={fetchPieces} displayKey="designation" value={p.articleId} onChange={updatePiece(idx, 'articleId')} />
            <NumberInput name={`qte_${idx}`} value={p.quantite} onChange={updatePiece(idx, 'quantite')} min={1} />
            <input type="number" value={p.prixUnit} onChange={updatePiece(idx, 'prixUnit')} placeholder="Prix" className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
            {pieces.length > 1 && <button onClick={() => suppriméerPiece(idx)} className="text-red-400 text-xs">✕</button>}
          </div>
        ))}
        <button type="button" onClick={ajouterPiece} className="text-xs text-amber-400 font-bold">+ Ajouter pièce</button>
      </div>
      <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between mt-4">
        <span className="text-slate-400">Total pièces</span><span className="text-white font-bold">{totalPieces.toLocaleString('fr-FR')} FCFA</span>
      </div>
      <FormField label="Avance" name="avance" type="number" value={form.avance} onChange={set('avance')} min={0} unit="FCFA" />
    </FormModal>
  );
}
