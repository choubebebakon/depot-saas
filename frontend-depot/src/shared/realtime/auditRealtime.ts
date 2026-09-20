import { io, Socket } from 'socket.io-client';

let auditSocket: Socket | null = null;

export interface AuditRealtimeOptions {
  token: string | null;
  tenantId: string | null;
  enabled: boolean;
  onEvent: (payload: any) => void;
  onStatus?: ((status: string, reason?: any) => void) | null;
}

function resolveUrl(): string {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.replace(/\/$/, '');
  const apiUrl = import.meta.env.VITE_API_URL;
  if (typeof apiUrl === 'string' && apiUrl.trim()) {
    return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  }
  return window.location.origin;
}

/**
 * Souscription temps réel au journal d'audit (AuditGateway — namespace racine, PATRON only).
 * Un socket séparé est utilisé : le canal /realtime est réservé aux événements de données.
 */
export function connectAuditRealtime({ token, tenantId, enabled, onEvent, onStatus }: AuditRealtimeOptions): () => void {
  if (!enabled || !token || !tenantId) return () => {};

  const handlers = { onEvent, onStatus: onStatus ?? null };

  if (auditSocket) {
    if (auditSocket.auth?.token !== token) {
      auditSocket.disconnect();
      auditSocket.removeAllListeners();
      auditSocket = null;
    }
  }

  if (!auditSocket) {
    auditSocket = io(resolveUrl(), {
      auth: { token },
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
    });
  }

  const socket = auditSocket;
  const safe = (fn: (payload: any) => void, arg: any) => {
    try { fn(arg); } catch (error) { console.error('[AuditRealtime] Callback error:', error); }
  };

  const onAuditUpdate = (payload: any) => {
    if (!payload?.tenantId || payload.tenantId !== tenantId) return;
    safe(handlers.onEvent, payload);
  };
  const onError = () => {
    if (handlers.onStatus) safe(handlers.onStatus, 'error', { code: 'UNAUTHORIZED' });
  };
  const onConnect = () => {
    if (handlers.onStatus) safe(handlers.onStatus, 'connected');
  };
  const onDisconnect = (reason: string) => {
    if (handlers.onStatus) safe(handlers.onStatus, 'disconnected', reason);
  };

  socket.on('audit_update', onAuditUpdate);
  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onConnect);

  if (socket.connected) safe(handlers.onStatus, 'connected');

  return () => {
    socket?.off('audit_update', onAuditUpdate);
    socket?.off('connect', onConnect);
    socket?.off('disconnect', onDisconnect);
  };
}

export function disconnectAuditRealtime(): void {
  if (auditSocket) {
    auditSocket.removeAllListeners();
    auditSocket.disconnect();
  }
  auditSocket = null;
}