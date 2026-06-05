export default function ConfirmDialog({ open, onConfirm, onCancel, title = 'Confirmer', message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'danger', icon = '⚠️' }) {
  if (!open) return null;

  const colors = {
    danger: { bg: 'bg-red-600 hover:bg-red-500', border: 'border-red-500/30' },
    warning: { bg: 'bg-amber-600 hover:bg-amber-500', border: 'border-amber-500/30' },
    primary: { bg: 'bg-amber-500 hover:bg-amber-400', border: 'border-amber-500/30' },
  };

  const c = colors[variant] || colors.danger;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative bg-slate-900 border ${c.border} rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center`}>
        <span className="text-5xl">{icon}</span>
        <h3 className="text-white font-black text-lg mt-4 mb-2">{title}</h3>
        {message && <p className="text-slate-400 text-sm mb-6">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`flex-1 ${c.bg} text-white font-bold py-3 rounded-xl transition-colors`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
