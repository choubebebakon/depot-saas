import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = '/notifications';

// Singleton résistant au HMR Vite : la réévaluation du module (hot reload)
// ne doit pas réinitialiser `socket`, sinon l'ancienne socket reste connectée
// en orpheline et un doublon de connexion est créé (POST 400 sid inconnu).
function getSocketRegistry() {
  const win = typeof window !== 'undefined' ? window : globalThis;
  if (!win.__depotNotifSocket) {
    win.__depotNotifSocket = { socket: null };
  }
  return win.__depotNotifSocket;
}

export function useNotifications() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);

  const userId = user?.id || user?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', tenantId, userId],
    queryFn: async () => {
      const res = await api.get(API_BASE, { params: { page: 1, limit: 20 } });
      return res.data;
    },
    enabled: !!tenantId && !!userId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data?.data) {
      setNotifications(data.data);
      setUnreadCount(data.unread ?? 0);
    }
  }, [data]);

  const statsQuery = useQuery({
    queryKey: ['notifications-stats', tenantId, userId],
    queryFn: async () => {
      const res = await api.get(`${API_BASE}/stats`);
      return res.data;
    },
    enabled: !!tenantId && !!userId,
    refetchInterval: 60000,
  });

  const addToast = useCallback((notif) => {
    const toast = { id: `${notif.id || 'notification'}-${Date.now()}`, ...notif };
    setToasts((prev) => {
      const next = [...prev, toast];
      if (next.length > 5) next.shift();
      return next;
    });
    const durations = { CRITICAL: 10000, HIGH: 7000, MEDIUM: 5000, LOW: 3000 };
    const duration = durations[notif.priority] || 5000;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, duration);
  }, []);

  useEffect(() => {
    const reg = getSocketRegistry();
    if (!user || !tenantId || !userId) {
      if (reg.socket) {
        reg.socket.disconnect();
        reg.socket.removeAllListeners();
        reg.socket = null;
      }
      setConnected(false);
      return undefined;
    }

    const token = localStorage.getItem('depot_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const existingToken = reg.socket?.auth?.token;

    // Recrée la socket si l'identité/token change (logout, changement de tenant,
    // renouvellement de session), afin de ne jamais conserver une connexion d'un ancien utilisateur.
    if (reg.socket && existingToken !== token) {
      reg.socket.disconnect();
      reg.socket.removeAllListeners();
      reg.socket = null;
    }

    if (!reg.socket) {
      reg.socket = io(`${apiUrl}/notifications`, {
        auth: { token },
        // forceNew : ce namespace doit posséder sa propre session engine.io.
        // Par défaut socket.io multiplexe tous les namespaces d'une même origine
        // sur UNE connexion partagée : la déconnexion de /realtime (dans le
        // cleanup de useRealtimeSync) ou du namespace racine fermait alors la
        // session commune, et ce client repartait avec un sid devenu inconnu
        // côté serveur ("Session ID unknown" → 400 sur /socket.io).
        forceNew: true,
        // Ordre [polling, websocket] obligatoire (cf. realtimeClient) : le
        // websocket d'abord casse la poignée de main sous double-rendu React.
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
      });
    }

    const socket = reg.socket;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNewNotification = (notif) => {
      if (!notif?.id) return;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === notif.id)) return prev;
        return [notif, ...prev].slice(0, 50);
      });
      setUnreadCount((prev) => prev + (notif.isRead ? 0 : 1));
      queryClient.setQueryData(['notifications', tenantId, userId], (current) => {
        if (!current?.data) return current;
        if (current.data.some((item) => item.id === notif.id)) return current;
        return { ...current, data: [notif, ...current.data].slice(0, 20), total: (current.total || 0) + 1, unread: (current.unread || 0) + (notif.isRead ? 0 : 1) };
      });
      addToast(notif);
    };
    const onRead = ({ id, all } = {}) => {
      if (all) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return;
      }
      if (!id) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };
    const onDeleted = ({ id, all } = {}) => {
      if (all) {
        setNotifications([]);
        setUnreadCount(0);
      } else if (id) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    };
    const onCount = ({ count } = {}) => {
      if (typeof count === 'number') setUnreadCount(Math.max(0, count));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNewNotification);
    socket.on('notification:read', onRead);
    socket.on('notification:deleted', onDeleted);
    socket.on('notification:count', onCount);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNewNotification);
      socket.off('notification:read', onRead);
      socket.off('notification:deleted', onDeleted);
      socket.off('notification:count', onCount);
    };
  }, [user, tenantId, userId, addToast, queryClient]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useMutation({
    mutationFn: async (id) => api.patch(`${API_BASE}/${id}/read`),
    onSuccess: (_, id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => api.patch(`${API_BASE}/read-all`),
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id) => api.delete(`${API_BASE}/${id}`),
    onSuccess: (_, id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      queryClient.invalidateQueries({ queryKey: ['notifications', tenantId, userId] });
    },
  });

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    connected,
    toasts,
    stats: statsQuery.data,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotif: deleteNotif.mutate,
    removeToast,
  };
}
