import { io } from 'socket.io-client';

let socket = null;

function resolveRealtimeUrl() {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');

  return window.location.origin;
}

export function connectRealtime({ token, depotId = null, onEvent, onReady, onError, onStatus } = {}) {
  if (!token) return null;

  if (socket) {
    socket.auth = { token, ...(depotId ? { depotId } : {}) };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(`${resolveRealtimeUrl()}/realtime`, {
    auth: { token, ...(depotId ? { depotId } : {}) },
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
  socket.on('realtime:ready', onReady);
  socket.on('realtime:error', onError);
  socket.on('realtime:event', onEvent);

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}

export function getRealtimeSocket() {
  return socket;
}
