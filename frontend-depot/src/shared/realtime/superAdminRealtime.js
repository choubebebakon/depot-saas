import { io } from 'socket.io-client';

function resolveRealtimeUrl() {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  return window.location.origin;
}

export function connectSuperAdminRealtime({ token, onEvent, onStatus, onError } = {}) {
  if (!token) return null;

  const isDev = import.meta.env.DEV;

  const socket = io(`${resolveRealtimeUrl()}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    // En développement, limiter les tentatives pour éviter le spam console
    // quand le backend n'est pas démarré. En production, reconnexion infinie.
    reconnectionAttempts: isDev ? 5 : Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => onStatus?.('connected'));
  socket.on('disconnect', (reason) => onStatus?.('disconnected', reason));
  socket.on('connect_error', (error) => {
    onStatus?.('error', error);
    onError?.(error);
  });
  socket.on('realtime:error', (error) => onError?.(error));
  socket.on('realtime:platform-event', (event) => onEvent?.(event));

  return socket;
}
