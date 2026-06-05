export default function EmptyState({ icon = '📋', title, message, action, actionLabel }) {
  return (
    <div className="text-center py-20">
      <span className="text-6xl">{icon}</span>
      {title && <p className="text-slate-400 font-semibold mt-4">{title}</p>}
      {message && <p className="text-slate-500 text-sm mt-1">{message}</p>}
      {action && actionLabel && (
        <button onClick={action}
          className="mt-6 bg-amber-500 hover:bg-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
