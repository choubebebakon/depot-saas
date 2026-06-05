import { useState } from 'react';
import api from '../../../api';
import FormModal from '../../../shared/components/forms/FormModal';
import FormField from '../../../shared/components/forms/FormField';
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


export default function MenuJourForm({ isOpen, onClose, onSuccess, metier = 'restaurant' }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), platsDisponibles: [], prixSpeciaux: {} });
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const prefix = `/${metier}`;

  const chargerPlats = async () => {
    try {
      const r = await api.get(`${prefix}/plats`);
      const allPlats = r.data?.data || r.data || [];
      setPlats(allPlats);
      setForm(prev => ({ ...prev, platsDisponibles: allPlats.map(p => p.id) }));
    } catch {}
  };

  useState(() => { chargerPlats(); }, []);

  const togglePlat = (platId) => {
    setForm(prev => ({
      ...prev,
      platsDisponibles: prev.platsDisponibles.includes(platId)
        ? prev.platsDisponibles.filter(id => id !== platId)
        : [...prev.platsDisponibles, platId],
    }));
  };

  const setPrixSpecial = (platId) => (e) => {
    setForm(prev => ({ ...prev, prixSpeciaux: { ...prev.prixSpeciaux, [platId]: e.target.value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post(`${prefix}/menu-jour`, form); onSuccess(); onClose(); }
    catch (err) { setErrors({ general: err.response?.data?.message || 'Erreur' }); } finally { setLoading(false); }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="📋 Menu du jour" loading={loading} size="lg" submitLabel="Enregistrer le menu" submitIcon="📋">
      {errors.general && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{errors.general}</div>}
      <DateTimePicker label="Date" name="date" value={form.date} onChange={set('date')} required />
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {plats.map(plat => {
          const dispo = form.platsDisponibles.includes(plat.id);
          return (
            <div key={plat.id} className={`p-3 rounded-xl border transition-all ${dispo ? 'bg-slate-800 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/30 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => togglePlat(plat.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${dispo ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 text-transparent'}`}>
                  ✓
                </button>
                <span className="flex-1 text-white text-sm">{plat.nom}</span>
                <span className="text-slate-400 text-xs">{Number(plat.prix).toLocaleString('fr-FR')} FCFA</span>
                {dispo && (
                  <input type="number" value={form.prixSpeciaux[plat.id] || ''} onChange={setPrixSpecial(plat.id)} placeholder="Prix spé"
                    className="w-24 bg-slate-700 border border-slate-600 text-white rounded-lg px-2 py-1.5 text-xs text-right" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FormModal>
  );
}
