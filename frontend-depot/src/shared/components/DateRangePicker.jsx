import { useState } from 'react';

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange, onApply, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none" />
      <span className="text-slate-500 text-xs">→</span>
      <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none" />
      {onApply && (
        <button onClick={onApply} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
          Appliquer
        </button>
      )}
    </div>
  );
}
