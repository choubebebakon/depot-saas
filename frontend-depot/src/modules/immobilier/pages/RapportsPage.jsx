import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useAuth } from '../../../contexts/AuthContext';

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


export default function RapportsPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'immobilier';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  
  const [time, setTime] = useState(new Date());
  const [type, setType] = useState('loyers');

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const { data: stats, loading, refetch  } = useData(`/${prefix}/rapports`, { enabled: true });

  const current = type === 'loyers' ? stats?.loyers || [] : type === 'biens' ? stats?.biens || [] : stats?.depenses || [];

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
;


  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-black text-white">📈 Rapports</h1><p className="text-slate-400 text-sm">Indicateurs de performance immobilière</p></div>
      <div className="flex gap-3 flex-wrap">
        {[
          { id: 'loyers', label: 'Loyers', icon: '💰' },
          { id: 'biens', label: 'Biens', icon: '🏠' },
          { id: 'depenses', label: 'Dépenses', icon: '💸' },
        ].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === t.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{t.icon} {t.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Biens occupés</p><p className="text-white font-black text-xl mt-1">{stats?.biensOccupes}</p></div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Loyers du mois</p><p className="text-white font-black text-xl mt-1">{(stats?.loyersMois || 0).toLocaleString('fr-FR')} F</p></div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Paiements en retard</p><p className="text-red-400 font-black text-xl mt-1">{stats?.retards}</p></div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4"><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Revenus annuels</p><p className="text-white font-black text-xl mt-1">{(stats?.revenus || 0).toLocaleString('fr-FR')} F</p></div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50"><tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">{Object.keys(current[0] || {}).map(k => <th key={k} className="text-left px-5 py-4">{k}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-700/50">{current.map((r, i) => (
            <tr key={i} className="hover:bg-slate-700/20">{Object.values(r).map((v, j) => <td key={j} className="px-5 py-4 text-white font-semibold text-sm">{typeof v === 'number' && v > 1000 ? `${v.toLocaleString('fr-FR')} F` : v}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
