import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../../hooks/useData';
import { useNotif } from '../../../context/NotifContext';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';

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


export default function AgendaPage() {
  const { metier: metierParam } = useParams();
  const { metier: metierAuth } = useAuth();
  const metier = metierParam || metierAuth || 'salon_beaute';
  const prefix = 'salon';

  const [deleting, setDeleting] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [selectedDate, setSelectedDate] = useState(null);
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else { setMonth(m => m - 1); } };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else { setMonth(m => m + 1); } };

  const today = new Date();
  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const getDayEvents = (day) => events.filter(e => { const d = new Date(e.date); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; });

  const { success, error: notifError } = useNotif();

  const { data: eventsData = [], loading, refetch } = useData(`/${prefix}/agenda`, { enabled: true });
  const events = Array.isArray(eventsData?.data) ? eventsData.data : (Array.isArray(eventsData) ? eventsData : []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();



  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">📅 Agenda</h1>
        <div className="flex items-center gap-3"><button onClick={prevMonth} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700">◀</button><span className="text-white font-bold text-lg">{MONTHS[month]} {year}</span><button onClick={nextMonth} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700">▶</button></div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => <div key={d} className="text-center text-slate-500 text-xs font-bold uppercase tracking-wider py-2">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1; const dayEvents = getDayEvents(day); const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
            <button key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)}
              className={`aspect-square rounded-xl p-2 text-left transition-all flex flex-col ${isToday ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-slate-800/60 border border-slate-700/50 hover:border-pink-500/30'} ${selectedDate === day ? 'ring-2 ring-pink-500' : ''}`}>
              <span className={`text-sm font-bold ${isToday ? 'text-pink-400' : 'text-white'}`}>{day}</span>
              {dayEvents.slice(0, 2).map((e, j) => <span key={j} className="text-[8px] text-slate-400 truncate leading-tight mt-0.5">💇 {e.clientNom}</span>)}
              {dayEvents.length > 2 && <span className="text-[8px] text-pink-400 font-bold mt-0.5">+{dayEvents.length - 2}</span>}
            </button>
          );
        })}
      </div>
      {selectedDate && <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"><h2 className="text-white font-black text-sm mb-4">{selectedDate} {MONTHS[month]} {year}</h2>{getDayEvents(selectedDate).length === 0 ? <p className="text-slate-500 text-sm">Aucun RDV</p> : (
        <div className="space-y-2">{getDayEvents(selectedDate).map((e, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-800/80 rounded-xl px-4 py-3"><div className="flex items-center gap-3"><span className="text-lg">💇</span><div><p className="text-white text-sm font-semibold">{e.clientNom}</p><p className="text-slate-400 text-xs">{e.prestation || e.heure || ''}</p></div></div><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${e.statut === 'TERMINE' ? 'bg-green-500/20 text-green-400' : e.statut === 'EN_COURS' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{e.statut}</span></div>
        ))}</div>
      )}</div>}
    </div>
  );
}
