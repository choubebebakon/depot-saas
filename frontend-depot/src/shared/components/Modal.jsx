import { useEffect } from 'react';

export default function Modal({ open, onClose, title, icon, children, maxWidth = 'max-w-lg', footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full ${maxWidth} shadow-2xl overflow-y-auto max-h-[90vh]`}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black text-xl flex items-center gap-2">
              {icon && <span>{icon}</span>} {title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-lg">
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
