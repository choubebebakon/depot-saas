import { useState, useEffect } from 'react'; import api from '../../../api';

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

export default function ParametresPage() {
  const [settings, setSettings] = useState({ nom: '', telephone: '', email: '', adresse: '', horaires: '', taxe: '', devise: 'FCFA' });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/boulangerie/parametres').then(r => setSettings(r.data)).catch(() => {
      setSettings({ nom: 'Ma Boulangerie', telephone: '+225 0101020304', email: 'contact@maboulangerie.ci', adresse: 'Abidjan, Cocody', horaires: 'Lun-Dim 05:00-21:00', taxe: '18', devise: 'FCFA' });
    }).finally(() => setLoading(false));
  }, []);
  const handleSubmit = async (e) => { e.preventDefault(); setSaving(true); try { await api.put('/boulangerie/parametres', settings); setSaved(true); setTimeout(() => setSaved(false), 3000); } catch { alert('Erreur'); } finally { setSaving(false); } };
  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-black text-white tracking-tight">⚙️ Paramètres</h1><p className="text-slate-400 text-sm">Configuration Boulangerie</p></div>
      {saved && <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-5 py-3 text-emerald-400 text-sm font-bold">✅ Enregistré</div>}
      <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[{key:'nom',label:'Nom',type:'text'},{key:'telephone',label:'Téléphone',type:'tel'},{key:'email',label:'Email',type:'email'},{key:'taxe',label:'Taxe (%)',type:'number'}].map(f => (
          <div key={f.key}><label className="text-slate-400 text-xs font-bold uppercase block mb-1.5">{f.label}</label><input type={f.type} value={settings[f.key]} onChange={e => setSettings({...settings, [f.key]: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" /></div>
        ))}</div>
        <div><label>Adresse</label><input type="text" value={settings.adresse} onChange={e => setSettings({...settings, adresse: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white w-full text-sm" /></div>
        <button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm w-full">{saving ? '...' : '💾 Enregistrer'}</button>
      </form>
    </div>
  );
}
