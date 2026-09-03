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

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const updateCount = useCallback(async () => {
    const keys = await syncQueue.keys();
    setPendingCount(keys.length);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void syncQueue.keys().then((keys) => {
      if (!cancelled) setPendingCount(keys.length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    const identity = getQueueIdentity();
    if (!identity) return;

    const keys = await syncQueue.keys();
    if (keys.length === 0) return;

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
        if (!sameIdentity(item.identity, identity)) {
          continue;
        }

        try {
          await api({
            method: item.method,
            url: item.url,
            data: { ...item.data, createdAt: item.timestamp }
          });

          await syncQueue.removeItem(item.id);
          await updateCount();
        } catch (error) {
          console.error(`Erreur de synchronisation pour l'element ${item.id}:`, error);
          const status = error.response?.status;

          // Authentication/authorization failures must not silently discard business data.
          if (status === 401 || status === 403) {
            break;
          }

          // Client-side validation/not-found errors cannot succeed by retrying unchanged.
          if (status >= 400 && status < 500) {
            await syncQueue.removeItem(item.id);
            await updateCount();
          } else {
            // Network/server failures: preserve ordering and retry later.
            break;
          }
        }
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      window.dispatchEvent(new CustomEvent('sync-end'));
    }
  }, [updateCount]);

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
      identity
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

  return { addToQueue, pendingCount, isSyncing, processQueue };
}
