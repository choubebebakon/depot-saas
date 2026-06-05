import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from './useNotifications';

const priorityColors = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#3b82f6', LOW: '#6b7280' };
const categoryIcons = {
  STOCK: '📦', PAYMENT: '💳', SUBSCRIPTION: '📅', RESERVATION: '🏨',
  ORDER: '📋', DELIVERY: '🚚', SECURITY: '🔒', APPOINTMENT: '📅',
  MAINTENANCE: '🔧', SYSTEM: '⚙️', METIER: '🏪', IA: '🤖',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FILTER_OPTIONS = [
  { label: 'Toutes', value: '' },
  { label: 'Non lues', value: 'unread' },
  { label: 'Stock', value: 'STOCK' },
  { label: 'Paiements', value: 'PAYMENT' },
  { label: 'Réservations', value: 'RESERVATION' },
  { label: 'Commandes', value: 'ORDER' },
  { label: 'Sécurité', value: 'SECURITY' },
  { label: 'IA', value: 'IA' },
];

export default function NotificationsPage() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const { markAsRead, markAllAsRead, deleteNotif } = useNotifications();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', tenantId, filter, page, search],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (filter === 'unread') params.isRead = false;
      else if (filter) params.category = filter;
      if (search) params.search = search;
      const res = await api.get('/notifications', { params });
      return res.data;
    },
    enabled: !!tenantId,
  });

  const { data: stats } = useQuery({
    queryKey: ['notifications-stats', tenantId],
    queryFn: async () => {
      const res = await api.get('/notifications/stats');
      return res.data;
    },
    enabled: !!tenantId,
  });

  const notifications = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.skeletonHeader} />
        <div style={styles.skeletonList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={styles.skeletonItem}>
              <div style={{ width: '100%', height: '16px', background: '#1e293b', borderRadius: '6px' }} />
              <div style={{ width: '60%', height: '12px', background: '#1e293b', borderRadius: '6px', marginTop: '8px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications</h1>
          {stats && (
            <div style={styles.statsRow}>
              <span style={styles.stat}><strong>{stats.total}</strong> total</span>
              <span style={styles.stat}><strong>{stats.unread}</strong> non lues</span>
              {stats.critical > 0 && (
                <span style={{ ...styles.stat, color: '#ef4444' }}>
                  <strong>{stats.critical}</strong> critiques
                </span>
              )}
            </div>
          )}
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => markAllAsRead()} style={styles.actionBtn}>
            ✅ Tout marquer lu
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterTabs}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              style={{
                ...styles.filterTab,
                background: filter === opt.value ? '#1e293b' : 'transparent',
                color: filter === opt.value ? '#f1f5f9' : '#64748b',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.list}>
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: '48px' }}>🔔</span>
            <p style={styles.emptyTitle}>Aucune notification</p>
            <p style={styles.emptySub}>Vous n'avez pas encore de notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                ...styles.item,
                background: n.isRead ? 'transparent' : '#0f172a',
                borderLeft: `3px solid ${n.isRead ? 'transparent' : priorityColors[n.priority] || '#3b82f6'}`,
              }}
            >
              <div style={styles.itemIcon}>
                {categoryIcons[n.category] || '🔔'}
              </div>
              <div style={styles.itemBody}>
                <div style={styles.itemTop}>
                  <span style={styles.itemTitle}>{n.title || n.type}</span>
                  {n.category && (
                    <span style={styles.badgeCat}>{n.category}</span>
                  )}
                  {(n.priority === 'HIGH' || n.priority === 'CRITICAL') && (
                    <span style={{ ...styles.badgePriority, background: priorityColors[n.priority] }}>
                      {n.priority}
                    </span>
                  )}
                </div>
                <div style={styles.itemMessage}>{n.message}</div>
                <div style={styles.itemMeta}>
                  <span>{formatDate(n.createdAt)}</span>
                  {n.actionLabel && (
                    <a href={n.actionUrl} style={styles.actionLink}>{n.actionLabel}</a>
                  )}
                </div>
              </div>
              <div style={styles.itemActions}>
                {!n.isRead && (
                  <button onClick={() => markAsRead(n.id)} style={styles.iconBtn} title="Marquer lu">👁️</button>
                )}
                <button onClick={() => deleteNotif(n.id)} style={styles.iconBtn} title="Supprimer">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={styles.pageBtn}
          >
            ← Précédent
          </button>
          <span style={styles.pageInfo}>Page {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={styles.pageBtn}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title: { color: '#f1f5f9', fontSize: '24px', fontWeight: 700, margin: 0 },
  statsRow: { display: 'flex', gap: '16px', marginTop: '6px' },
  stat: { color: '#64748b', fontSize: '13px' },
  headerActions: { display: 'flex', gap: '8px' },
  actionBtn: {
    background: '#1e293b', border: 'none', color: '#e2e8f0',
    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
  },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  filterTab: {
    padding: '6px 14px', borderRadius: '8px', border: 'none',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  searchInput: {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px',
    padding: '6px 12px', color: '#e2e8f0', fontSize: '13px',
    outline: 'none', flex: 1, minWidth: '200px', fontFamily: 'inherit',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '4px' },
  item: {
    display: 'flex', gap: '12px', padding: '14px 16px',
    borderRadius: '10px', transition: 'background 0.15s',
  },
  itemIcon: { fontSize: '24px', flexShrink: 0, marginTop: '2px' },
  itemBody: { flex: 1, minWidth: 0 },
  itemTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' },
  itemTitle: { color: '#f1f5f9', fontWeight: 600, fontSize: '14px' },
  badgeCat: {
    background: '#1e293b', color: '#94a3b8', fontSize: '10px',
    fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
  },
  badgePriority: {
    color: '#fff', fontSize: '10px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '6px',
  },
  itemMessage: { color: '#94a3b8', fontSize: '13px', lineHeight: 1.4, marginBottom: '6px' },
  itemMeta: { display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', color: '#64748b' },
  actionLink: { color: '#3b82f6', textDecoration: 'none', fontWeight: 600 },
  itemActions: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: '16px', padding: '4px', borderRadius: '6px', lineHeight: 1,
  },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { color: '#f1f5f9', fontSize: '18px', fontWeight: 600, margin: '12px 0 4px' },
  emptySub: { color: '#64748b', fontSize: '14px', margin: 0 },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '16px', marginTop: '24px',
  },
  pageBtn: {
    background: '#1e293b', border: 'none', color: '#e2e8f0',
    padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
  },
  pageInfo: { color: '#64748b', fontSize: '13px' },
  skeletonHeader: { height: '40px', width: '200px', background: '#1e293b', borderRadius: '8px', marginBottom: '20px' },
  skeletonList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  skeletonItem: { background: '#0f172a', borderRadius: '10px', padding: '16px' },
};
