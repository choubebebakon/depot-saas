import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = '/notifications';

let socketInstance = null;

export function useNotifications() {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);
  const toastsRef = useRef([]);

  const userId = user?.id || user?.userId;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', tenantId],
    queryFn: async () => {
      const res = await api.get(API_BASE, { params: { page: 1, limit: 20 } });
      return res.data;
    },
    enabled: !!tenantId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data?.data) {
      setNotifications(data.data);
      setUnreadCount(data.unread ?? 0);
    }
  }, [data]);

  const statsQuery = useQuery({
    queryKey: ['notifications-stats', tenantId],
    queryFn: async () => {
      const res = await api.get(`${API_BASE}/stats`);
      return res.data;
    },
    enabled: !!tenantId,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!user || !tenantId || !userId) { // FIX #4: Fermeture de la socket si l'utilisateur devient indéfini
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance.removeAllListeners();
        socketInstance = null;
      }
      return;
    }

    if (socketInstance?.connected) return; // FIX #4: Évite de recréer la socket si déjà connectée

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (!socketInstance) {
      socketInstance = io(`${apiUrl}/notifications`, {
        auth: { token: localStorage.getItem('depot_token') },
        transports: ['websocket', 'polling'],
      });
    }

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));
    socketInstance.on('notification:new', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      addToast(notif);
    });
    socketInstance.on('notification:read', ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (id) setUnreadCount((prev) => Math.max(0, prev - 1));
    });
    socketInstance.on('notification:deleted', ({ id, all }) => {
      if (all) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    });
    socketInstance.on('notification:count', ({ count }) => setUnreadCount(count));

    return () => {
      if (socketInstance) {
        socketInstance.disconnect(); // FIX #4: Déconnexion de la socket au logout ou démontage
        socketInstance.removeAllListeners(); // FIX #4: Nettoyage des écouteurs pour éviter les fuites mémoire
        socketInstance = null; // FIX #4: Remise à null pour forcer la réinitialisation au prochain login
      }
    };
  }, [user, tenantId, userId]);

  const addToast = useCallback((notif) => {
    const toast = { id: Date.now(), ...notif };
    setToasts((prev) => {
      const next = [...prev, toast];
      if (next.length > 5) next.shift();
      return next;
    });
    const durations = { CRITICAL: 10000, HIGH: 7000, MEDIUM: 5000, LOW: 3000 };
    const duration = durations[notif.priority] || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useMutation({
    mutationFn: async (id) => api.patch(`${API_BASE}/${id}/read`),
    onSuccess: (_, id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => api.patch(`${API_BASE}/read-all`),
    onSuccess: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id) => api.delete(`${API_BASE}/${id}`),
    onSuccess: (_, id) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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
