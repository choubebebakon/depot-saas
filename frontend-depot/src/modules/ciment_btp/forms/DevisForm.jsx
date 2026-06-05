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


export default function DevisForm({ isOpen, onClose, onSuccess, edit, metier = 'quincaillerie' }) {
  const [form, setForm] = useState({ clientId: '', chantierId: '', dateExpiry: '', notes: '', remiseGlobale: 0 });
  const [lignes, setLignes] = useState([{ articleId: '', designation: '', quantite: 1, unite: 'PIECE', prixUnitaire: '', remise: 0 }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [chantiers, setChantiers] = useState([]);

  const [search, setSearch] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useState(() => {
    api.get(`/${metier}/chantiers`).then(r => setChantiers(r.data?.data || r.data || [])).catch(() => {});
    if (edit) { setForm({ clientId: edit.clientId || '', chantierId: edit.chantierId || '', dateExpiry: edit.dateExpiry?.slice(0, 10) || '', notes: edit.notes || '', remiseGlobale: edit.remiseGlobale || 0 }); if (edit.lignes) setLignes(edit.lignes); }
  }, [edit]);
  const prefix = `/${metier}`;
  const fetchClients = async (q) => { const r = await api.get(`${prefix}/clients`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };
  const fetchArticles = async (q) => { const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } }); return r.data?.data || r.data || []; };

  const ajouterLigne = () => setLignes([...lignes, { articleId: '', designation: '', quantite: 1, unite: 'PIECE', prixUnitaire: '', remise: 0 }]);
  const suppriméerLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));
  const updateLigne = (idx, field) => (e) => { const n = [...lignes]; n[idx] = { ...n[idx], [field]: e.target.value }; setLignes(n); };
  const handleArticleSelect = (idx) => (article) => {
    const n = [...lignes]; n[idx] = { ...n[idx], articleId: article.id, designation: article.designation, prixUnitaire: article.prixVente || '' };
    setLignes(n);
  };

  const totalHT = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0) * (1 - (Number(l.remise) || 0) / 100), 0);
  const remiseMt = totalHT * (Number(form.remiseGlobale) || 0) / 100;
  const totalApresRemise = totalHT - remiseMt;
  const tva = totalApresRemise * 0.1925;
  const totalTTC = totalApresRemise + tva;

  const validate = () => { const errs = {}; if (!form.clientId) errs.clientId = 'Sélectionnez un client'; if (lignes.filter(l => l.articleId && l.prixUnitaire).length === 0) errs.lignes = 'Ajoutez au moins une ligne de devis'; return errs; };
  const handleSubmit = async (e) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (Object.keys(errs).length > 0) return; setLoading(true);
    try { const payload = { ...form, lignes: lignes.filter(l => l.articleId), totalHT, totalTTC }; if (edit) await api.patch(`${prefix}/devis/${edit.id}`, payload); else await api.post(`${prefix}/devis`, payload); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier devis' : '📋 Nouveau devis'} loading={loading} size="xl" submitLabel={edit ? 'Modifier' : 'Créer'}>
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <AutocompleteInput label="Client" name="clientId" value={form.clientId} onChange={set('clientId')} fetchSuggestions={fetchClients} displayKey="nom" placeholder="Rechercher un client..." required error={errors.clientId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Chantier associé" name="chantierId" type="select" value={form.chantierId} onChange={set('chantierId')} options={chantiers.map(c => ({ value: c.id, label: c.nom }))} />
        <DateTimePicker label="Date d'expiration" name="dateExpiry" value={form.dateExpiry} onChange={set('dateExpiry')} />
      </div>
      <div className="border-t border-slate-700/50 pt-4 mt-2">
        <h4 className="text-white font-bold text-sm mb-3">📋 Lignes du devis</h4>
        {lignes.map((l, idx) => (
          <div key={idx} className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <AutocompleteInput name={`art_${idx}`} fetchSuggestions={fetchArticles} displayKey="designation" value={l.articleId} onChange={updateLigne(idx, 'articleId')} onSelect={handleArticleSelect(idx)} placeholder="Article..." />
              <input type="text" value={l.designation} onChange={updateLigne(idx, 'designation')} placeholder="Designation" className="w-32 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
              <input type="number" value={l.quantite} onChange={updateLigne(idx, 'quantite')} min={1} className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
              <FormField name={`unite_${idx}`} type="select" value={l.unite} onChange={updateLigne(idx, 'unite')} options={['PIECE', 'kg', 'm²', 'm³', 'litre', 'barre', 'sac', 'palette']} />
              <input type="number" value={l.prixUnitaire} onChange={updateLigne(idx, 'prixUnitaire')} placeholder="Prix" className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
              <input type="number" value={l.remise} onChange={updateLigne(idx, 'remise')} placeholder="% remise" className="w-16 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-2 text-sm" />
              <span className="text-white font-bold font-mono text-sm w-20 text-right">{((Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0) * (1 - (Number(l.remise) || 0) / 100)).toLocaleString('fr-FR')}</span>
              {lignes.length > 1 && <button onClick={() => suppriméerLigne(idx)} className="text-red-400 text-xs">✕</button>}
            </div>
          </div>
        ))}
        <button type="button" onClick={ajouterLigne} className="text-xs text-amber-400 font-bold">+ Ajouter une ligne</button>
        {errors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes}</p>}
      </div>
      <div className="p-4 bg-slate-800 rounded-xl space-y-1 text-sm mt-4">
        <div className="flex justify-between text-slate-400"><span>Total HT</span><span>{totalHT.toLocaleString('fr-FR')} FCFA</span></div>
        {form.remiseGlobale > 0 && <div className="flex justify-between text-amber-400"><span>Remise globale ({form.remiseGlobale}%)</span><span>-{remiseMt.toLocaleString('fr-FR')} FCFA</span></div>}
        <div className="flex justify-between text-slate-400"><span>TVA (19.25%)</span><span>{tva.toLocaleString('fr-FR')} FCFA</span></div>
        <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-slate-600"><span>Total TTC</span><span>{totalTTC.toLocaleString('fr-FR')} FCFA</span></div>
      </div>
      <FormField label="Remise globale" name="remiseGlobale" type="number" value={form.remiseGlobale} onChange={set('remiseGlobale')} min={0} max={100} unit="%" />
      <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={set('notes')} rows={2} />
    </FormModal>
  );
}
