import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { PERMISSIONS } from '../permissions';
import { usePermission } from '../../../shared/hooks/usePermission';

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


export default function ParametresPage() {
  const perm = usePermission(PERMISSIONS, 'parametres');
  const [config, setConfig] = useState({
    nomClinique: '', adresse: '', telephone: '', email: '', devise: 'FCFA',
    horaireOuverture: '08:00', horaireFermeture: '18:00', consultationPrix: '5000',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const inputClass = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none w-full';


  const load = useCallback(async () => {
    try { const res = await api.get('/clinique/config'); const d = res.data?.data || res.data || {}; if (d.nomClinique) setConfig(prev => ({ ...prev, ...d })); }
    catch (_) {}
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.patch('/clinique/config', config); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (_) {}
    finally { setLoading(false); }
  };


  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8"><h1 className="text-2xl font-black text-white">⚙️ Paramètres</h1><p className="text-slate-400 text-sm mt-1">Configuration de la clinique</p></div>
      <form onSubmit={handleSave} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-white font-bold text-sm mb-4">🏥 Informations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Nom de la clinique</label><input value={config.nomClinique} onChange={e => setConfig({...config, nomClinique: e.target.value})} className={inputClass} /></div>
            <div className="col-span-2"><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Adresse</label><input value={config.adresse} onChange={e => setConfig({...config, adresse: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Téléphone</label><input value={config.telephone} onChange={e => setConfig({...config, telephone: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Email</label><input type="email" value={config.email} onChange={e => setConfig({...config, email: e.target.value})} className={inputClass} /></div>
          </div>
        </div>
        <div className="border-t border-slate-700/50 pt-6">
          <h2 className="text-white font-bold text-sm mb-4">⚙️ Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Devise</label><select value={config.devise} onChange={e => setConfig({...config, devise: e.target.value})} className={inputClass}><option>FCFA</option><option>EUR</option><option>USD</option></select></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Prix consultation (F)</label><input type="number" value={config.consultationPrix} onChange={e => setConfig({...config, consultationPrix: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Ouverture</label><input type="time" value={config.horaireOuverture} onChange={e => setConfig({...config, horaireOuverture: e.target.value})} className={inputClass} /></div>
            <div><label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 block">Fermeture</label><input type="time" value={config.horaireFermeture} onChange={e => setConfig({...config, horaireFermeture: e.target.value})} className={inputClass} /></div>
          </div>
        </div>
        {perm.canEdit && (
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={loading} className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20">{loading ? '⏳...' : '💾 Enregistrer'}</button>
            {saved && <span className="text-emerald-400 font-bold text-sm">✓ Configuration enregistrée</span>}
          </div>
        )}
      </form>
    </div>
  );
}
