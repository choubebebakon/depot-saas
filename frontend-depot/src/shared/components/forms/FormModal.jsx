import { useEffect, useCallback } from 'react';

export default function FormModal({ isOpen, onClose, onSubmit, title, loading, size = 'md', children, submitLabel, submitIcon = '💾' }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

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

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full ${sizes[size] || sizes.md} shadow-2xl overflow-y-auto max-h-[90vh] animate-slide-up`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-black text-xl">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">{children}</div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
              ) : (
                <>{submitIcon} {submitLabel || 'Enregistrer'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
