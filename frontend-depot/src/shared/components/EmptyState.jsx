import React from 'react';

export default function EmptyState({ title = 'Aucune donnée', description = 'Aucun élément à afficher.', icon = null, action = null, children = null, className = '' }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 p-8 text-center ${className}`}>
      {icon && <div aria-hidden="true">{icon}</div>}
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="max-w-md text-sm text-slate-400">{description}</p>
      {action}
      {children}
    </div>
  );
}
