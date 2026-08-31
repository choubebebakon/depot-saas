import { useEffect, useRef } from 'react';

export default function ConfirmModal({
  isOpen, onConfirm, onCancel, title = 'Confirmer', message,
  confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = true,
  loading = false,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div role="dialog" aria-modal="true" aria-labelledby="gestock-confirm-modal-title"
        className={`relative bg-slate-900 border rounded-2xl p-7 w-full max-w-sm shadow-2xl text-center ${danger ? 'border-red-500/30' : 'border-amber-500/30'}`}>
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 text-3xl" aria-hidden="true">{danger ? '⚠️' : 'ℹ️'}</span>
        <h3 id="gestock-confirm-modal-title" className="text-white font-black text-lg mt-4 mb-2">{title}</h3>
        {message && <div className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</div>}
        <div className="flex gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold py-3 rounded-xl transition-colors">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'} disabled:opacity-40`}>
            {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />}
            {loading ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
