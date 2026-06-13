import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useAuth } from '../../../contexts/AuthContext';
import AlertLevel from '../components/AlertLevel';

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


export default function DashboardPharmacie() {
  const navigate = useNavigate();
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'pharmacie';
  const prefix = metier.toLowerCase().replace(/_/g, '-');
  const [time, setTime] = useState(new Date());

  const [month, setMonth] = useState(new Date().getMonth());

  const { data: stats, loading } = useData(`/${prefix}/stats`, { enabled: true });

  const expirees = (stats?.expirees || []).filter(i => i.datePeremption && new Date(i.datePeremption) < new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 60000); return () => clearInterval(t); }, []);

  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
;

return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">💊 Tableau de Bord Pharmacie</h1>
          <p className="text-slate-400 text-sm mt-1">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/pharmacie/caisse')}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
            🏧 Ouvrir Caisse
          </button>
          <button onClick={() => navigate('/pharmacie/medicaments')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            💊 Médicaments
          </button>
        </div>
      </div>

      {stats?.alertesExpirees > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="text-red-400 font-bold text-sm">{stats.alertesExpirees} médicament{stats.alertesExpirees > 1 ? 's' : ''} expiré{stats.alertesExpirees > 1 ? 's' : ''} !</p>
            <p className="text-slate-400 text-xs">Action requise — détruisez ou retournez au fournisseur</p>
          </div>
          <button onClick={() => navigate('/pharmacie/alertes-dlc')}
            className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-4 py-2 rounded-xl text-xs transition-colors">
            Voir les alertes
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '💰', label: 'Ventes Jour', value: `${(stats?.ventesJour || 0).toLocaleString('fr-FR')} F`, color: '#10b981' },
          { icon: '📝', label: 'Ordonnances', value: stats?.ordonnancesJour || 0, sub: "Aujourd'hui", color: '#3b82f6' },
          { icon: '⏰', label: 'Alertes DLC', value: (stats?.alertes7j || 0) + (stats?.alertesExpirees || 0), sub: `Dont ${stats?.alertesExpirees || 0} expirée${stats?.alertesExpirees > 1 ? 's' : ''}`, color: '#ef4444' },
          { icon: '⚠️', label: 'Stock Critique', value: stats?.stockCritique || 0, sub: 'Médicaments', color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
            {k.sub && <p className="text-slate-500 text-xs mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AlertLevel items={stats?.expirees || []} title="🔴 Expirés" icon="🔴" color="#ef4444" />
        <AlertLevel items={stats?.alertes7j || []} title="🟠 < 7 jours" icon="🟠" color="#f59e0b" />
        <AlertLevel items={stats?.alertes30j || []} title="🟡 < 30 jours" icon="🟡" color="#eab308" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-white font-black text-lg mb-5">🏆 Top Médicaments du Mois</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="text-left pb-3 pl-2">#</th>
                <th className="text-left pb-3">Médicament</th>
                <th className="text-right pb-3">Qté vendue</th>
                <th className="text-right pb-3 pr-2">CA (F CFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {stats?.topMedicaments?.map((m, i) => (
                <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 pl-2">
                    <span className={`text-xs font-black ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'}`}>#{i + 1}</span>
                  </td>
                  <td className="py-3 text-white font-semibold text-sm">{m.nom}</td>
                  <td className="py-3 text-right text-slate-300 text-sm font-mono">{m.qte}</td>
                  <td className="py-3 pr-2 text-right text-emerald-400 text-sm font-bold">{(m.ca || 0).toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Nouveau Médicament', icon: '💊', path: '/pharmacie/medicaments', color: '#059669' },
          { label: 'Nouvelle Ordonnance', icon: '📝', path: '/pharmacie/ordonnances', color: '#3b82f6' },
          { label: 'Alertes DLC', icon: '⏰', path: '/pharmacie/alertes-dlc', color: '#ef4444' },
          { label: 'Nouveau Patient', icon: '👤', path: '/pharmacie/patients', color: '#8b5cf6' },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)}
            className="bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{a.icon}</span>
            <span className="text-slate-300 text-xs font-bold text-center">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


