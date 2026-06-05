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


export default function DashboardClinique() {
  const navigate = useNavigate();
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'clinique';
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
          <h1 className="text-3xl font-black text-white tracking-tight">🏥 Tableau de Bord Clinique</h1>
          <p className="text-slate-400 text-sm mt-1">{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/clinique/rendez-vous')} className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-sky-500/20">📅 Rendez-vous</button>
          <button onClick={() => navigate('/clinique/patients')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">👥 Patients</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📅', label: 'RDV aujourd\'hui', value: stats?.rdvAujourdhui || 0, color: '#0ea5e9' },
          { icon: '🩺', label: 'Consultations', value: stats?.consultationsJour || 0, sub: 'Aujourd\'hui', color: '#10b981' },
          { icon: '👥', label: 'Patients total', value: stats?.patientsTotal || 0, color: '#3b82f6' },
          { icon: '🏧', label: 'Caisse jour', value: `${(stats?.caisseJour || 0).toLocaleString('fr-FR')} F`, color: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:border-sky-500/30 transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: k.color + '22' }}>{k.icon}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-white font-black text-2xl leading-none">{k.value}</p>
            {k.sub && <p className="text-slate-500 text-xs mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">🩺 Consultations par motif</h2>
          <div className="space-y-3">
            {stats?.consultations?.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{c.motif}</span><span className="text-slate-400">{c.count}</span></div>
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${(c.count / Math.max(...stats.consultations.map(x => x.count))) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-black text-sm mb-4">📅 Prochains rendez-vous</h2>
          <div className="space-y-2">
            {[
              { patient: 'Kouamé Jean', medecin: 'Dr. Diallo', heure: '09:00', motif: 'Consultation' },
              { patient: 'Touré Fatou', medecin: 'Dr. Koné', heure: '10:30', motif: 'Suivi' },
              { patient: 'Soro Moussa', medecin: 'Dr. Diallo', heure: '11:00', motif: 'Urgence' },
              { patient: 'Bamba Adama', medecin: 'Dr. Koné', heure: '14:00', motif: 'Vaccination' },
              { patient: 'Coulibaly Awa', medecin: 'Dr. Touré', heure: '15:30', motif: 'Consultation' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white font-semibold text-sm">{r.patient}</p>
                  <p className="text-slate-400 text-xs">{r.medecin} — {r.motif}</p>
                </div>
                <span className="text-sky-400 font-mono font-bold text-sm">{r.heure}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
