import { io } from 'socket.io-client';

let socket = null;
let currentConfig = { token: null, depotId: null };
let handlers = {
  onEvent: null,
  onReady: null,
  onError: null,
  onStatus: null,
};

function resolveRealtimeUrl() {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');

  return window.location.origin;
}

function buildAuth(token, depotId) {
  return { token, ...(depotId ? { depotId } : {}) };
}

export function connectRealtime({ token, depotId = null, onEvent, onReady, onError, onStatus } = {}) {
  if (!token) return null;

  const normalizedDepotId = depotId || null;
  handlers = { onEvent, onReady, onError, onStatus };

  if (socket) {
    const configChanged = currentConfig.token !== token || currentConfig.depotId !== normalizedDepotId;
    currentConfig = { token, depotId: normalizedDepotId };
    socket.auth = buildAuth(token, normalizedDepotId);

    if (configChanged) {
      // Le depot actif fait partie de l'autorisation de la socket.
      // Reconnecter force le gateway à recalculer la room autorisée.
      if (socket.connected) socket.disconnect();
      socket.connect();
    } else if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  currentConfig = { token, depotId: normalizedDepotId };

  socket = io(`${resolveRealtimeUrl()}/realtime`, {
    auth: buildAuth(token, normalizedDepotId),
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => handlers.onStatus?.('connected'));
  socket.on('disconnect', (reason) => handlers.onStatus?.('disconnected', reason));
  socket.on('connect_error', (error) => {
    handlers.onStatus?.('error', error);
    handlers.onError?.(error);
  });
  socket.on('realtime:ready', (event) => handlers.onReady?.(event));
  socket.on('realtime:error', (error) => handlers.onError?.(error));
  socket.on('realtime:event', (event) => handlers.onEvent?.(event));

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
  currentConfig = { token: null, depotId: null };
  handlers = { onEvent: null, onReady: null, onError: null, onStatus: null };
}

export function getRealtimeSocket() {
  return socket;
}
