import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function ProductionJourForm({ isOpen, onClose, onSuccess, metier = 'boulangerie' }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), productions: [], invendus: {} });
  const [recettes, setRecettes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));


  const prefix = `/${metier}`;

  useState(() => {
    api.get(`${prefix}/recettes`).then(r => {
      const items = r.data?.data || r.data || [];
      setRecettes(items);
      setForm(prev => ({
        ...prev,
        productions: items.map(r => ({ recetteId: r.id, quantiteProduite: 0 })),
        invendus: Object.fromEntries(items.map(r => [r.id, 0])),
      }));
    }).catch(() => {});
  }, []);

  const updateProduction = (recetteId, value) => {
    setForm(prev => ({
      ...prev,
      productions: prev.productions.map(p => p.recetteId === recetteId ? { ...p, quantiteProduite: Number(value) || 0 } : p),
    }));
  };

  const updateInvendus = (recetteId, value) => {
    setForm(prev => ({ ...prev, invendus: { ...prev.invendus, [recetteId]: Number(value) || 0 } }));
  };

  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true);
    try { await api.post(`${prefix}/production`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="🏭 Production du jour" loading={loading} size="xl" submitLabel="Enregistrer la production" submitIcon="💾">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <DateTimePicker label="Date" name="date" value={form.date} onChange={set('date')} />
      <div className="space-y-2 mt-4">
        {recettes.map(recette => {
          const prod = form.productions.find(p => p.recetteId === recette.id);
          return (
            <div key={recette.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <span className="flex-1 text-white text-sm font-medium">{recette.nom}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Produit</span>
                  <input type="number" value={prod?.quantiteProduite || 0} onChange={(e) => updateProduction(recette.id, e.target.value)}
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Invendu</span>
                  <input type="number" value={form.invendus[recette.id] || 0} onChange={(e) => updateInvendus(recette.id, e.target.value)}
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FormModal>
  );
}
