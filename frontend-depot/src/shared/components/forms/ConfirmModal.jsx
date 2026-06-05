import { useEffect, useCallback } from 'react';

export default function ConfirmModal({
  isOpen, onConfirm, onCancel, title = 'Confirmer', message,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = true,
  loading = false,
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative bg-slate-900 border rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center ${danger ? 'border-red-500/30' : 'border-amber-500/30'}`}>
        <span className="text-5xl">{danger ? '⚠️' : 'ℹ️'}</span>
        <h3 className="text-white font-black text-lg mt-4 mb-2">{title}</h3>
        {message && <p className="text-slate-400 text-sm mb-6">{message}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold py-3 rounded-xl transition-colors">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-500 hover:bg-amber-400 text-slate-900'} disabled:opacity-40`}>
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
