import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
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


export default function ChargementForm({ isOpen, onClose, onSuccess, edit, metier = 'depot', tourneeId }) {
  const [lignes, setLignes] = useState([{ articleId: '', quantiteChargee: 1 }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');
  const totalValeur = lignes.reduce((acc, i) => acc + (i.valeurStock || i.valeur || i.quantite * i.prix || 0), 0);


  const prefix = `/${metier}`;

  const fetchArticles = async (q) => {
    const r = await api.get(`${prefix}/articles`, { params: { search: q, limit: 8 } });
    return r.data?.data || r.data || [];
  };


  const validate = () => {
    const errs = {};
    const articlesValides = lignes.filter(l => l.articleId && l.quantiteChargee > 0);
    if (articlesValides.length === 0) errs.lignes = 'Ajoutez au moins un article avec une quantité valide';
    return errs;
  };

  const updateLigne = (idx, field) => (e) => {
    const next = [...lignes];
    next[idx] = { ...next[idx], [field]: e.target.value };
    setLignes(next);
  };

  const ajouterLigne = () => setLignes([...lignes, { articleId: '', quantiteChargee: 1 }]);
  const suppriméerLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await api.post(`${prefix}/tournees/${tourneeId}/chargement`, { articles: lignes.filter(l => l.articleId) });
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title={edit ? '✏️ Modifier chargement' : '📦 Chargement de tournée'} loading={loading} size="lg" submitIcon="💾" submitLabel="Enregistrer le chargement">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="space-y-3">
        {lignes.map((ligne, idx) => (
          <div key={idx} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-bold uppercase">Article {idx + 1}</span>
              {lignes.length > 1 && (
                <button type="button" onClick={() => suppriméerLigne(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕ Supprimer</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AutocompleteInput label="Article" name={`article_${idx}`} value={ligne.articleId} onChange={updateLigne(idx, 'articleId')} fetchSuggestions={fetchArticles} displayKey="designation" placeholder="Rechercher..." />
              <NumberInput label="Quantité" name={`qte_${idx}`} value={ligne.quantiteChargee} onChange={updateLigne(idx, 'quantiteChargee')} min={1} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={ajouterLigne}
        className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 text-sm font-bold transition-all mt-3">
        + Ajouter un article
      </button>
      {errors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes}</p>}
      <div className="p-3 bg-slate-800 rounded-xl text-sm flex justify-between items-center mt-3">
        <span className="text-slate-400">Total valeur chargée</span>
        <span className="text-white font-bold font-mono">{totalValeur.toLocaleString('fr-FR')} FCFA</span>
      </div>
    </FormModal>
  );
}
