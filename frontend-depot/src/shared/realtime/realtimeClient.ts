import { io, Socket } from 'socket.io-client';

interface RealtimeConfig {
  token: string | null;
  depotId: string | null;
}

interface RealtimeHandlers {
  onEvent: ((event: any) => void) | null;
  onReady: ((event: any) => void) | null;
  onError: ((error: any) => void) | null;
  onStatus: ((status: string, reason?: any) => void) | null;
}

let socket: Socket | null = null;
let currentConfig: RealtimeConfig = { token: null, depotId: null };
let handlers: RealtimeHandlers = {
  onEvent: null,
  onReady: null,
  onError: null,
  onStatus: null,
};

function resolveRealtimeUrl(): string {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.replace(/\/$/, '');
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (typeof apiUrl === 'string' && apiUrl.trim()) {
    return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  }

  return window.location.origin;
}

function buildAuth(token: string, depotId: string | null) {
  return { token, ...(depotId ? { depotId } : {}) };
}

// Isolation d'exécution : Empêche une erreur de rendu React de crasher l'instance Socket
const safeInvoke = <K extends keyof RealtimeHandlers>(
  handlerName: K,
  ...args: Parameters<NonNullable<RealtimeHandlers[K]>>
) => {
  try {
    const handler = handlers[handlerName];
    if (typeof handler === 'function') {
      (handler as (...a: any[]) => void)(...args);
    }
  } catch (error) {
    console.error(`[RealtimeClient] Erreur d'exécution du callback ${String(handlerName)}:`, error);
  }
};

// Un refus d'authentification (jeton expiré, session close…) ne se règle pas par
// une nouvelle tentative : socket.io réessaierait indéfiniment avec le même jeton,
// ce qui produisait des rafales de « Socket refusée … jwt expired » côté serveur.
// On coupe la reconnexion automatique ; useRealtimeSync relance la connexion dès
// qu'un nouveau jeton est disponible (cf. récupération via l'intercepteur axios).
const AUTH_ERROR_HINTS = ['jwt', 'token', 'unauthor', 'forbidden'];

function isAuthError(error: any): boolean {
  if (!error) return false;
  if (typeof error === 'object' && (error.code === 'UNAUTHORIZED' || error.code === 'TOKEN_EXPIRED')) {
    return true;
  }
  const message = typeof error === 'string' ? error : String(error.message ?? '');
  return AUTH_ERROR_HINTS.some((hint) => message.toLowerCase().includes(hint));
}

function stopReconnectOnAuthFailure(currentSocket: Socket, error: any): void {
  if (!isAuthError(error)) return;
  currentSocket.disconnect();
}

export interface ConnectRealtimeOptions extends Partial<RealtimeHandlers> {
  token?: string | null;
  depotId?: string | null;
}

export function connectRealtime({ token, depotId = null, onEvent, onReady, onError, onStatus }: ConnectRealtimeOptions = {}): Socket | null {
  if (!token) return null;

  const normalizedDepotId = depotId || null;
  handlers = {
    onEvent: onEvent ?? null,
    onReady: onReady ?? null,
    onError: onError ?? null,
    onStatus: onStatus ?? null,
  };

  if (socket) {
    const configChanged = currentConfig.token !== token || currentConfig.depotId !== normalizedDepotId;
    currentConfig = { token, depotId: normalizedDepotId };
    socket.auth = buildAuth(token, normalizedDepotId);

    if (configChanged) {
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
    // forceNew : /realtime dispose de sa propre session engine.io. Le cleanup
    // de useRealtimeSync appelle disconnectRealtime() à chaque re-exécution de
    // l'effet : sans isolation, cette déconnexion fermait le Manager partagé
    // avec /notifications et le namespace racine, dont les clients repartaient
    // avec un sid inconnu ("Session ID unknown" → 400 sur /socket.io).
    forceNew: true,
    // CORRECTION CRITIQUE : L'ordre [polling, websocket] est obligatoire en production 
    // pour éviter l'échec de poignée de main sous réseau instable ou double-rendu React.
    transports: ['polling', 'websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  socket.on('connect', () => safeInvoke('onStatus', 'connected'));
  socket.on('disconnect', (reason) => safeInvoke('onStatus', 'disconnected', reason));
  socket.on('connect_error', (error) => {
    safeInvoke('onStatus', 'error', error);
    safeInvoke('onError', error);
    stopReconnectOnAuthFailure(socket as Socket, error);
  });
  socket.on('realtime:ready', (event) => safeInvoke('onReady', event));
  socket.on('realtime:error', (error) => {
    safeInvoke('onError', error);
    stopReconnectOnAuthFailure(socket as Socket, error);
  });
  socket.on('realtime:event', (event) => safeInvoke('onEvent', event));

  return socket;
}

export function disconnectRealtime(): void {
  if (socket) {
    socket.removeAllListeners(); // Purge des écouteurs pour éviter les fuites mémoire
    socket.disconnect();
  }
  socket = null;
  currentConfig = { token: null, depotId: null };
  handlers = { onEvent: null, onReady: null, onError: null, onStatus: null };
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}