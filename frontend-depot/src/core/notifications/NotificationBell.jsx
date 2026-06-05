import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './useNotifications';

const priorityColors = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#3b82f6',
  LOW: '#6b7280',
};

function timeAgo(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasCritical = notifications.some((n) => n.priority === 'CRITICAL' && !n.isRead);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={styles.bellBtn}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ ...styles.badge, animation: hasCritical ? 'pulse 1s infinite' : 'none' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {hasCritical && <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>}

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()} style={styles.markAllBtn}>
                Tout marquer lu
              </button>
            )}
          </div>

          <div style={styles.list}>
            {recent.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: '32px' }}>🔔</span>
                <p style={styles.emptyText}>Aucune notification</p>
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    if (n.actionUrl) navigate(n.actionUrl);
                    setOpen(false);
                  }}
                  style={{
                    ...styles.item,
                    background: n.isRead ? 'transparent' : '#1e293b',
                  }}
                >
                  <div style={{ ...styles.dot, backgroundColor: priorityColors[n.priority] || '#6b7280' }} />
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>{n.title || n.type}</div>
                    <div style={styles.itemMessage}>
                      {(n.message || '').substring(0, 60)}
                    </div>
                    <div style={styles.itemTime}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div style={styles.unreadDot} />}
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => { navigate('/notifications'); setOpen(false); }}
            style={styles.viewAllBtn}
          >
            Voir tout
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  bellBtn: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    transition: 'background 0.15s',
  },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-4px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '340px',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #1e293b',
  },
  headerTitle: { color: '#f1f5f9', fontWeight: 700, fontSize: '15px' },
  markAllBtn: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  list: { maxHeight: '340px', overflowY: 'auto' },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 16px',
    border: 'none',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    color: '#e2e8f0',
    fontSize: '13px',
    fontFamily: 'inherit',
    transition: 'background 0.1s',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '5px',
    flexShrink: 0,
  },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: 600, fontSize: '13px', color: '#f1f5f9', marginBottom: '2px' },
  itemMessage: { color: '#94a3b8', fontSize: '12px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemTime: { color: '#64748b', fontSize: '11px', marginTop: '4px' },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
    marginTop: '5px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    gap: '8px',
  },
  emptyText: { color: '#64748b', fontSize: '13px', margin: 0 },
  viewAllBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    background: '#1e293b',
    border: 'none',
    color: '#3b82f6',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: 'inherit',
  },
};
