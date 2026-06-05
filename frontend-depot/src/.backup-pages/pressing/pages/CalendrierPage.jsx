import { useState, useEffect } from 'react'; import api from '../../../api';
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
export default function CalendrierPage() {
  const [today] = useState(new Date()); const [month, setMonth] = useState(today.getMonth()); const [year, setYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]); const [loading, setLoading] = useState(true); const [selectedDate, setSelectedDate] = useState(null);
  useEffect(() => {
    setLoading(true);
    api.get('/pressing/calendrier', { params: { month: month + 1, year } }).then(r => setEvents(r.data)).catch(() => setEvents([])).finally(() => setLoading(false));
  }, [month, year]);
  const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else { setMonth(m => m - 1); } };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else { setMonth(m => m + 1); } };
  const getDayEvents = (day) => events.filter(e => { const d = new Date(e.date); return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year; });
  if (loading) return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">📅 Calendrier</h1>
        <div className="flex items-center gap-3"><button onClick={prevMonth} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700">◀</button><span className="text-white font-bold text-lg">{MONTHS[month]} {year}</span><button onClick={nextMonth} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700">▶</button></div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => <div key={d} className="text-center text-slate-500 text-xs font-bold uppercase tracking-wider py-2">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1; const dayEvents = getDayEvents(day); const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
            <button key={day} onClick={() => setSelectedDate(day === selectedDate ? null : day)}
              className={`aspect-square rounded-xl p-2 text-left transition-all flex flex-col ${isToday ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-slate-800/60 border border-slate-700/50 hover:border-purple-500/30'} ${selectedDate === day ? 'ring-2 ring-purple-500' : ''}`}>
              <span className={`text-sm font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>{day}</span>
              {dayEvents.slice(0, 2).map((e, j) => <span key={j} className="text-[8px] text-slate-400 truncate leading-tight mt-0.5">{e.type === 'DEPOT' ? '📥' : '📤'} {e.clientNom}</span>)}
              {dayEvents.length > 2 && <span className="text-[8px] text-purple-400 font-bold mt-0.5">+{dayEvents.length - 2}</span>}
            </button>
          );
        })}
      </div>
      {selectedDate && <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6"><h2 className="text-white font-black text-sm mb-4">{selectedDate} {MONTHS[month]} {year}</h2>{getDayEvents(selectedDate).length === 0 ? <p className="text-slate-500 text-sm">Aucun événement</p> : (
        <div className="space-y-2">{getDayEvents(selectedDate).map((e, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-800/80 rounded-xl px-4 py-3"><div className="flex items-center gap-3"><span className="text-lg">{e.type === 'DEPOT' ? '📥' : '✅'}</span><div><p className="text-white text-sm font-semibold">{e.clientNom}</p><p className="text-slate-400 text-xs">{e.articles || e.type}</p></div></div><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${e.statut === 'PRET' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>{e.statut || e.type}</span></div>
        ))}</div>
      )}</div>}
    </div>
  );
}
