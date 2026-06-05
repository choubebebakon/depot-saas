import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotifContext = createContext(null);

let notifId = 0;

export function NotifProvider({ children, defaultDuration }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef({});

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const notify = useCallback(({ type = 'info', title, message, duration }) => {
    const id = ++notifId;
    const durations = { success: 3000, error: 5000, warning: 4000, info: 3000 };
    const ttl = duration || defaultDuration || durations[type] || 3000;

    setNotifications((prev) => [...prev, { id, type, title, message }]);
    timersRef.current[id] = setTimeout(() => remove(id), ttl);
    return id;
  }, [remove, defaultDuration]);

  const success = useCallback((msg, title) => notify({ type: 'success', title, message: msg }), [notify]);
  const error = useCallback((msg, title) => notify({ type: 'error', title, message: msg }), [notify]);
  const warning = useCallback((msg, title) => notify({ type: 'warning', title, message: msg }), [notify]);
  const info = useCallback((msg, title) => notify({ type: 'info', title, message: msg }), [notify]);

  return (
    <NotifContext.Provider value={{ notifications, notify, remove, success, error, warning, info }}>
      {children}
      <NotifContainer items={notifications} onRemove={remove} />
    </NotifContext.Provider>
  );
}

export function useNotif() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotif doit être utilisé dans NotifProvider');
  return ctx;
}

const icons = {
  success: '\u2705',
  error: '\u274C',
  warning: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
};

const colors = {
  success: { bg: '#065f46', border: '#34d399', text: '#d1fae5' },
  error: { bg: '#7f1d1d', border: '#f87171', text: '#fee2e2' },
  warning: { bg: '#78350f', border: '#fbbf24', text: '#fef3c7' },
  info: { bg: '#1e3a5f', border: '#60a5fa', text: '#dbeafe' },
};

function NotifContainer({ items, onRemove }) {
  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '16px', right: '16px', zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: '8px',
      maxWidth: '400px', pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes notifSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes notifSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `}</style>
      {items.map((n) => {
        const c = colors[n.type] || colors.info;
        return (
          <div key={n.id} style={{
            animation: 'notifSlideIn 0.25s ease-out',
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: '12px', padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icons[n.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {n.title && (
                <div style={{ color: c.text, fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{n.title}</div>
              )}
              <div style={{ color: c.text, fontSize: '12px', opacity: 0.9, lineHeight: 1.3 }}>{n.message}</div>
            </div>
            <button onClick={() => onRemove(n.id)} style={{
              background: 'none', border: 'none', color: c.text, cursor: 'pointer',
              fontSize: '18px', padding: '0 2px', opacity: 0.6, flexShrink: 0,
            }}>&times;</button>
          </div>
        );
      })}
    </div>
  );
}
