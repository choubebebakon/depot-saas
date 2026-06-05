import { useEffect, useState } from 'react';
import { useNotifications } from './useNotifications';

const variantConfig = {
  CRITICAL: { bg: '#fef2f2', border: '#fecaca', icon: '❌', color: '#dc2626' },
  HIGH: { bg: '#fff7ed', border: '#fed7aa', icon: '⚠️', color: '#c2410c' },
  MEDIUM: { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️', color: '#2563eb' },
  LOW: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', color: '#16a34a' },
};

const durations = { CRITICAL: 10000, HIGH: 7000, MEDIUM: 5000, LOW: 3000 };

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);
  const config = variantConfig[toast.priority] || variantConfig.MEDIUM;
  const duration = durations[toast.priority] || 5000;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      style={{
        ...styles.toast,
        background: config.bg,
        borderColor: config.border,
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div style={styles.toastInner}>
        <span style={{ fontSize: '18px' }}>{config.icon}</span>
        <div style={styles.toastContent}>
          <div style={{ ...styles.toastTitle, color: config.color }}>
            {toast.title || toast.type}
          </div>
          <div style={styles.toastMessage}>
            {(toast.message || '').substring(0, 80)}
          </div>
        </div>
        <button onClick={() => onRemove(toast.id)} style={styles.closeBtn}>×</button>
      </div>
      {toast.actionUrl && toast.actionLabel && (
        <button
          onClick={() => { window.location.href = toast.actionUrl; }}
          style={{ ...styles.actionBtn, color: config.color }}
        >
          {toast.actionLabel}
        </button>
      )}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%`, background: config.color }} />
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { toasts, removeToast } = useNotifications();

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInTop {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '380px',
    pointerEvents: 'none',
  },
  toast: {
    borderRadius: '12px',
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    pointerEvents: 'auto',
  },
  toastInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
  },
  toastContent: { flex: 1, minWidth: 0 },
  toastTitle: { fontWeight: 700, fontSize: '13px', marginBottom: '2px' },
  toastMessage: { color: '#475569', fontSize: '12px', lineHeight: 1.3 },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  },
  actionBtn: {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: 'inherit',
  },
  progressBar: {
    height: '3px',
    background: '#e2e8f0',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.1s linear',
  },
};
