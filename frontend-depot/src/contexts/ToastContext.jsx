import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const addToast = useCallback(({ type = 'success', title, message, duration }) => {
    const id = ++toastId;
    const durations = { success: 3000, error: 5000, warning: 4000, info: 3000 };
    const ttl = duration || durations[type] || 3000;

    setToasts((prev) => [...prev, { id, type, title, message }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), ttl);
    return id;
  }, [removeToast]);

  const success = useCallback((msg, title) => addToast({ type: 'success', title, message: msg }), [addToast]);
  const error = useCallback((msg, title) => addToast({ type: 'error', title, message: msg }), [addToast]);
  const warning = useCallback((msg, title) => addToast({ type: 'warning', title, message: msg }), [addToast]);
  const info = useCallback((msg, title) => addToast({ type: 'info', title, message: msg }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const colors = {
  success: { bg: '#065f46', border: '#34d399', text: '#d1fae5' },
  error: { bg: '#7f1d1d', border: '#f87171', text: '#fee2e2' },
  warning: { bg: '#78350f', border: '#fbbf24', text: '#fef3c7' },
  info: { bg: '#1e3a5f', border: '#60a5fa', text: '#dbeafe' },
};

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px', zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: '8px',
      maxWidth: '400px', pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `}</style>
      {toasts.map((toast) => {
        const c = colors[toast.type] || colors.info;
        return (
          <div key={toast.id} style={{
            animation: 'toastSlideIn 0.25s ease-out',
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: '12px', padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icons[toast.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ color: c.text, fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{toast.title}</div>
              )}
              <div style={{ color: c.text, fontSize: '12px', opacity: 0.9, lineHeight: 1.3 }}>{toast.message}</div>
            </div>
            <button onClick={() => onRemove(toast.id)} style={{
              background: 'none', border: 'none', color: c.text, cursor: 'pointer',
              fontSize: '18px', padding: '0 2px', opacity: 0.6, flexShrink: 0,
            }}>×</button>
          </div>
        );
      })}
    </div>
  );
}
