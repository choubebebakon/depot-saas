export default function EmptyState({ icon = '📋', title = 'Aucune donnée', message, action, actionLabel, className = '' }) {
  return (
    <div className={`text-center py-16 px-6 ${className}`} role="status">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 text-3xl" aria-hidden="true">{icon}</span>
      <p className="text-slate-200 font-bold mt-4">{title}</p>
      {message && <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">{message}</p>}
      {action && actionLabel && (
        <button type="button" onClick={action}
          className="mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
