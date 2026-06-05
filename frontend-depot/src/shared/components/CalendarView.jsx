function DayCell({ date, events, onClick, isToday, isCurrentMonth }) {
  return (
    <div
      onClick={() => onClick?.(date)}
      className={`min-h-[80px] p-2 border border-slate-800 cursor-pointer transition-colors ${isToday ? 'bg-amber-500/10 border-amber-500/40' : 'hover:bg-slate-800/50'} ${!isCurrentMonth ? 'opacity-40' : ''}`}
    >
      <span className={`text-xs font-bold ${isToday ? 'text-amber-400' : 'text-slate-500'}`}>
        {date.getDate()}
      </span>
      <div className="mt-1 space-y-1">
        {events?.slice(0, 3).map((ev, i) => (
          <div key={i} className="text-[10px] bg-amber-500/20 text-amber-400 rounded px-1 py-0.5 truncate font-semibold">
            {ev.label || ev.nom || ev.title}
          </div>
        ))}
        {events?.length > 3 && <span className="text-[10px] text-slate-500 font-bold">+{events.length - 3}...</span>}
      </div>
    </div>
  );
}

export default function CalendarView({ currentDate, events, onDayClick, onDateChange, className = '' }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const dayNames = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

  const prevMonth = () => onDateChange?.(new Date(year, month - 1, 1));
  const nextMonth = () => onDateChange?.(new Date(year, month + 1, 1));

  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const getEvents = (date) => events?.filter(e => {
    const d = new Date(e.date || e.startDate || e.dateDebut);
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
  }) || [];

  return (
    <div className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <button onClick={prevMonth} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">◀</button>
        <h3 className="text-white font-black text-base">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">▶</button>
      </div>
      <div className="grid grid-cols-7">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center text-slate-500 text-xs font-bold py-2 border-b border-slate-800">{d}</div>
        ))}
        {days.map((d, i) => (
          <DayCell key={i} date={d} events={d ? getEvents(d) : []} onClick={onDayClick}
            isToday={d && d.getTime() === today.getTime()}
            isCurrentMonth={d !== null}
          />
        ))}
      </div>
    </div>
  );
}
