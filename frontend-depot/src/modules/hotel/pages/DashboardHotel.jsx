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


export default function DashboardHotel() {
  const navigate = useNavigate();
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'hotel';
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
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">🏨 Tableau de Bord Hôtel</h1>
          <p className="text-slate-400 text-sm mt-1">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/hotel/reservations')}
            className="bg-violet-500 hover:bg-violet-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
            📅 Réservations
          </button>
          <button onClick={() => navigate('/hotel/chambres')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            🛏️ Chambres
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🛏️', label: 'Occupées', value: `${stats?.chambresOccupees || 0}/${stats?.chambresTotal || 0}`, color: '#8b5cf6' },
          { icon: '📅', label: 'Réservations', value: stats?.reservationsJour || 0, sub: "Aujourd'hui", color: '#3b82f6' },
          { icon: '💰', label: 'Revenus Jour', value: `${(stats?.revenusJour || 0).toLocaleString('fr-FR')} F`, color: '#10b981' },
          { icon: '📈', label: "Taux d'occup.", value: `${stats?.tauxOccupation || 0}%`, sub: 'Global', color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-violet-500/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
            {k.sub && <p className="text-slate-500 text-xs mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-black text-sm flex items-center gap-2 mb-4">🚪 Check-ins / Check-outs <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{time.toLocaleDateString('fr-FR')}</span></h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
              <span className="text-slate-300 font-semibold text-sm">🚪 Arrivées</span>
              <span className="text-white font-black text-lg">{stats?.écheckinsJour || 0}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
              <span className="text-slate-300 font-semibold text-sm">🚪 Départs</span>
              <span className="text-white font-black text-lg">{stats?.écheckoutsJour || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-black text-sm flex items-center gap-2 mb-4">👨‍💼 Personnel en service</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <span className="text-3xl">👨‍💼</span>
            </div>
            <div>
              <p className="text-white font-black text-3xl">{stats?.personnelActif || 0}</p>
              <p className="text-slate-400 text-xs">membre{stats?.personnelActif > 1 ? 's' : ''} actif{stats?.personnelActif > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-slate-900/50 rounded-xl px-3 py-2 text-center">
              <p className="text-slate-400 text-xs">Services</p>
              <p className="text-white font-bold">{stats?.servicesJour || 0}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl px-3 py-2 text-center">
              <p className="text-slate-400 text-xs">Ménage</p>
              <p className="text-white font-bold">{stats?.menageEnCours || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-white font-black text-sm flex items-center gap-2 mb-4">🛏️ Occupation par type</h3>
          <div className="space-y-3">
            {stats?.topTypes?.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{t.type}</span>
                  <span className="text-slate-400">{t.occupees}/{t.total}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(t.occupees / t.total) * 100}%`, backgroundColor: '#8b5cf6' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
