import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, icon, children, maxWidth = 'max-w-lg', footer, closeOnBackdrop = true }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closeOnBackdrop && onClose?.()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'gestock-modal-title' : undefined}
        className={`relative bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 w-full ${maxWidth} shadow-2xl overflow-y-auto max-h-[90vh]`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 id="gestock-modal-title" className="text-white font-black text-xl flex items-center gap-2">
              {icon && <span aria-hidden="true">{icon}</span>} {title}
            </h3>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer"
              className="shrink-0 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-colors">
              ✕
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-6 pt-4 border-t border-slate-700/50">{footer}</div>}
      </div>
    </div>
  );
}
