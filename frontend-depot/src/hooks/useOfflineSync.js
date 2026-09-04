import { useState, useEffect, useCallback, useRef } from 'react';
import localforage from 'localforage';
import api from '../api/axios';
import { generateId } from '../utils/offline';

const syncQueue = localforage.createInstance({
  name: 'GesTock',
  storeName: 'syncQueue'
});

const MAX_QUEUE_SIZE = 100;

function getQueueIdentity() {
  try {
    const rawUser = localStorage.getItem('depot_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const userId = user?.id || user?.userId || null;
    const tenantId = user?.tenantId || user?.tenant?.id || null;
    const depotId = localStorage.getItem('depot_actif_id');

    if (!userId || !tenantId) return null;
    return {
      userId: String(userId),
      tenantId: String(tenantId),
      depotId: depotId && depotId !== 'all' ? String(depotId) : null
    };
  } catch {
    return null;
  }
}

function sameIdentity(a, b) {
  return Boolean(
    a &&
    b &&
    a.userId === b.userId &&
    a.tenantId === b.tenantId &&
    a.depotId === b.depotId
  );
}

function isRetryableStatus(status) {
  return !status || status === 408 || status === 425 || status === 429 || status >= 500;
}

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const updateCount = useCallback(async () => {
    const identity = getQueueIdentity();
    if (!identity) {
      setPendingCount(0);
      setFailedCount(0);
      return;
    }

    const keys = await syncQueue.keys();
    let pending = 0;
    let failed = 0;

    for (const key of keys) {
      const item = await syncQueue.getItem(key);
      if (!item || !sameIdentity(item.identity, identity)) continue;
      if (item.status === 'failed') failed += 1;
      else pending += 1;
    }

    setPendingCount(pending);
    setFailedCount(failed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void updateCount().finally(() => {
      if (cancelled) return;
    });

    const handleIdentityChange = () => {
      void updateCount();
    };

    window.addEventListener('storage', handleIdentityChange);
    window.addEventListener('gestock:auth-changed', handleIdentityChange);
    window.addEventListener('gestock:depot-changed', handleIdentityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleIdentityChange);
      window.removeEventListener('gestock:auth-changed', handleIdentityChange);
      window.removeEventListener('gestock:depot-changed', handleIdentityChange);
    };
  }, [updateCount]);

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    const identity = getQueueIdentity();
    if (!identity) return;

    const keys = await syncQueue.keys();
    if (keys.length === 0) {
      await updateCount();
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    window.dispatchEvent(new CustomEvent('sync-start'));

    try {
      const items = [];
      for (const key of keys) {
        const item = await syncQueue.getItem(key);
        if (item) items.push(item);
      }
      items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      for (const item of items) {
        // Never replay a mutation under a different authenticated user/tenant/depot.
        if (!sameIdentity(item.identity, identity)) continue;

        // A non-retryable business error is retained for explicit recovery instead
        // of being silently discarded or retried forever.
        if (item.status === 'failed') continue;

        try {
          await api({
            method: item.method,
            url: item.url,
            data: { ...item.data, createdAt: item.timestamp },
            headers: { 'X-Idempotency-Key': item.id }
          });

          await syncQueue.removeItem(item.id);
          await updateCount();
        } catch (error) {
          console.error(`Erreur de synchronisation pour l'element ${item.id}:`, error);
          const status = error.response?.status;

          // Authentication/authorization failures must not silently discard business data.
          // Keep the item so it can be recovered after the authenticated context is fixed.
          if (status === 401 || status === 403) {
            await syncQueue.setItem(item.id, {
              ...item,
              status: 'failed',
              failedAt: new Date().toISOString(),
              errorCode: status
            });
            await updateCount();
            break;
          }

          // Validation/conflict errors are not expected to succeed by automatic retry.
          // Preserve the payload and record only a small, non-sensitive error marker.
          if (status >= 400 && status < 500 && !isRetryableStatus(status)) {
            await syncQueue.setItem(item.id, {
              ...item,
              status: 'failed',
              failedAt: new Date().toISOString(),
              errorCode: status
            });
            await updateCount();
            continue;
          }

          // Network/server/rate-limit failures: preserve ordering and retry later.
          break;
        }
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      await updateCount();
      window.dispatchEvent(new CustomEvent('sync-end'));
    }
  }, [updateCount]);

  const retryFailed = useCallback(async () => {
    const identity = getQueueIdentity();
    if (!identity) return;

    const keys = await syncQueue.keys();
    for (const key of keys) {
      const item = await syncQueue.getItem(key);
      if (!item || !sameIdentity(item.identity, identity) || item.status !== 'failed') continue;
      await syncQueue.setItem(item.id, {
        ...item,
        status: 'pending',
        failedAt: undefined,
        errorCode: undefined
      });
    }

    await updateCount();
    if (navigator.onLine) await processQueue();
  }, [processQueue, updateCount]);

  const addToQueue = useCallback(async (method, url, data) => {
    const identity = getQueueIdentity();
    if (!identity) {
      throw new Error('Impossible de mettre une action hors ligne en file sans contexte utilisateur/tenant.');
    }

    const keys = await syncQueue.keys();
    if (keys.length >= MAX_QUEUE_SIZE) {
      throw new Error('La file hors ligne a atteint sa limite. Reconnectez-vous pour synchroniser les actions en attente.');
    }

    const id = generateId();
    const action = {
      id,
      method,
      url,
      data,
      timestamp: new Date().toISOString(),
      identity,
      status: 'pending'
    };

    await syncQueue.setItem(id, action);
    await updateCount();

    if (navigator.onLine) await processQueue();
  }, [processQueue, updateCount]);

  useEffect(() => {
    const handleOnline = () => {
      void processQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  return { addToQueue, pendingCount, failedCount, isSyncing, processQueue, retryFailed };
}
