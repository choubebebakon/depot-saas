import React from 'react';

export default function AlertLevel({ items, title, icon, color }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-white font-black text-sm">{title}</h3>
      </div>
      <p className="text-slate-400 text-xs mb-2">{items.length} médicament{items.length > 1 ? 's' : ''}</p>
      {items.length === 0 ? (
        <p className="text-slate-500 text-xs">Aucune alerte</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className="text-xs text-slate-300">
              {item.designation || item.nom} - {item.datePeremption ? new Date(item.datePeremption).toLocaleDateString('fr-FR') : '-'}
            </div>
          ))}
          {items.length > 5 && <p className="text-slate-500 text-xs">+{items.length - 5} autres...</p>}
        </div>
      )}
    </div>
  );
}
