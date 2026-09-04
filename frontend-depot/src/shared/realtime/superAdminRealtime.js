import { io } from 'socket.io-client';

function resolveRealtimeUrl() {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/v\\d+\/?$/, '').replace(/\/$/, '');
  return window.location.origin;
}

export function connectSuperAdminRealtime({ token, onEvent, onStatus, onError } = {}) {
  if (!token) return null;

  const socket = io(`${resolveRealtimeUrl()}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
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
