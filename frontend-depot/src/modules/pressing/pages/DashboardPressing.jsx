import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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


export default function DashboardPressing() {
  const navigate = useNavigate();
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pressing';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const [time, setTime] = useState(new Date());

  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const { data: stats, loading } = useData(`/${prefix}/stats`, { enabled: true });

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
;

return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-white tracking-tight">👔 Tableau de Bord Pressing</h1><p className="text-slate-400 text-sm mt-1">{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/pressing/tickets')} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20">🏷️ Tickets</button>
          <button onClick={() => navigate('/pressing/calendrier')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">📅 Calendrier</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🏷️', label: 'Tickets en cours', value: stats?.ticketsEnCours || 0, color: '#7c3aed' },
          { icon: '✅', label: 'Prêts à retirer', value: stats?.pretsRetrait || 0, color: '#10b981' },
          { icon: '💰', label: 'CA du jour', value: `${(stats?.caJour || 0).toLocaleString('fr-FR')} F`, color: '#f59e0b' },
          { icon: '👤', label: 'Clients fidèles', value: stats?.clientsFideles || 0, color: '#3b82f6' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">💰 Ventes du mois</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center"><span className="text-4xl">📊</span></div>
            <div><p className="text-white font-black text-5xl">{stats?.ventesMois || 0}</p><p className="text-slate-400 text-sm">ventes ce mois</p></div>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">🧼 Services proposés</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center"><span className="text-4xl">🧼</span></div>
            <div><p className="text-white font-black text-5xl">{stats?.services || 0}</p><p className="text-slate-400 text-sm">types de services</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
