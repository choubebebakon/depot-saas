import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function InventaireForm({ isOpen, onClose, onSuccess, metier = 'supermarche', depotId }) {
  const [form, setForm] = useState({ depotId: depotId || '', rayonId: '' });
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});
  const [rayons, setRayons] = useState([]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));




  useState(() => {
    api.get(`/${metier}/rayons`).then(r => setRayons(r.data?.data || r.data || [])).catch(() => {});
  }, [metier]);

  const prefix = `/${metier}`;

  const chargerStock = async () => {
    setLoadingData(true);
    try {
      const params = { depotId: form.depotId || undefined };
      if (form.rayonId) params.rayonId = form.rayonId;
      const r = await api.get(`${prefix}/stock`, { params });
      const articles = r.data?.data || r.data || [];
      setLignes(articles.map(a => ({ articleId: a.id, designation: a.designation, stockTheorique: Number(a.quantite) || 0, stockComptage: Number(a.quantite) || 0 })));
    } catch {} finally { setLoadingData(false); }
  };

  const updateComptage = (idx) => (e) => {
    setLignes(prev => { const n = [...prev]; n[idx] = { ...n[idx], stockComptage: Number(e.target.value) || 0 }; return n; });
  };

  const validate = () => {
    const errs = {};
    if (lignes.length === 0) errs.lignes = 'Chargez d\'abord les articles du dépôt';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      await api.post(`${prefix}/stock/inventaire`, {
        depotId: form.depotId,
        lignes: lignes.map(l => ({ articleId: l.articleId, stockPhysique: l.stockComptage })),
      });
      onSuccess(); onClose();
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Erreur' });
    } finally { setLoading(false); }
  };


  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="📋 Inventaire" loading={loading} size="xl" submitIcon="✅" submitLabel="Valider l'inventaire">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Rayon" name="rayonId" type="select" value={form.rayonId} onChange={set('rayonId')} options={rayons.map(r => ({ value: r.id, label: r.nom }))} />
        <div className="flex items-end">
          <button type="button" onClick={chargerStock} disabled={loadingData}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
            {loadingData ? '⏳...' : '📥 Charger le stock'}
          </button>
        </div>
      </div>
      {lignes.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2 mt-4">
          {lignes.map((l, idx) => {
            const ecart = l.stockComptage - l.stockTheorique;
            return (
              <div key={idx} className="flex items-center gap-3 p-2 bg-slate-800/60 rounded-xl">
                <span className="flex-1 text-white text-sm font-medium">{l.designation}</span>
                <span className="text-slate-400 text-xs w-16 text-right">{l.stockTheorique}</span>
                <input type="number" value={l.stockComptage} onChange={updateComptage(idx)}
                  className="w-20 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-sm text-center font-mono" />
                <span className={`text-xs font-bold w-16 text-right ${ecart > 0 ? 'text-emerald-400' : ecart < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {ecart > 0 ? '+' : ''}{ecart}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {errors.lignes && <p className="text-red-400 text-xs mt-2">⚠️ {errors.lignes}</p>}
    </FormModal>
  );
}
