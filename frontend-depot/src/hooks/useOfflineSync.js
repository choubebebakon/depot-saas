import { useState, useEffect, useCallback, useRef } from 'react';
import localforage from 'localforage';
import api from '../api/axios';
import { generateId } from '../utils/offline';

const syncQueue = localforage.createInstance({
  name: 'GesTock',
  storeName: 'syncQueue'
});

const MAX_QUEUE_SIZE = 100;
const MAX_ITEM_BYTES = 256 * 1024;
const SYNC_LOCK_KEY = 'gestock:offline-sync-lock';
const SYNC_LOCK_TTL_MS = 30_000;
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

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

function currentLockOwner() {
  try {
    const raw = localStorage.getItem(SYNC_LOCK_KEY);
    if (!raw) return null;
    const lock = JSON.parse(raw);
    if (!lock?.owner || !Number.isFinite(lock.expiresAt)) return null;
    if (lock.expiresAt <= Date.now()) {
      localStorage.removeItem(SYNC_LOCK_KEY);
      return null;
    }
    return lock;
  } catch {
    return null;
  }
}

function acquireFallbackLock(owner) {
  const existing = currentLockOwner();
  if (existing && existing.owner !== owner) return false;

  try {
    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({
      owner,
      expiresAt: Date.now() + SYNC_LOCK_TTL_MS
    }));
    return currentLockOwner()?.owner === owner;
  } catch {
    return true;
  }
}

function releaseFallbackLock(owner) {
  try {
    const existing = currentLockOwner();
    if (existing?.owner === owner) localStorage.removeItem(SYNC_LOCK_KEY);
  } catch {
    // Ignore storage failures; the TTL prevents a permanent lock.
  }
}

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);
  const lockOwnerRef = useRef(null);

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
    void updateCount();

    const handleIdentityChange = () => {
      void updateCount();
    };

    window.addEventListener('storage', handleIdentityChange);
    window.addEventListener('gestock:auth-changed', handleIdentityChange);
    window.addEventListener('gestock:depot-changed', handleIdentityChange);

    return () => {
      window.removeEventListener('storage', handleIdentityChange);
      window.removeEventListener('gestock:auth-changed', handleIdentityChange);
      window.removeEventListener('gestock:depot-changed', handleIdentityChange);
    };
  }, [updateCount]);

  const processQueueUnlocked = useCallback(async () => {
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
        // Re-read identity before every replay so logout/account/depot changes
        // cannot leak a queued mutation into another authenticated context.
        const currentIdentity = getQueueIdentity();
        if (!sameIdentity(item.identity, currentIdentity)) continue;

        if (!MUTATION_METHODS.has(String(item.method || '').toLowerCase())) {
          await syncQueue.setItem(item.id, {
            ...item,
            status: 'failed',
            failedAt: new Date().toISOString(),
            errorCode: 'UNSUPPORTED_METHOD'
          });
          await updateCount();
          continue;
        }

        // A non-retryable business error is retained for explicit recovery instead
        // of being silently discarded or retried forever.
        if (item.status === 'failed') continue;

        try {
          // Do not inject the queue timestamp into the business payload. It could
          // overwrite a legitimate createdAt field and change business semantics.
          await api({
            method: item.method,
            url: item.url,
            data: item.data,
            headers: {
              'X-Idempotency-Key': item.id,
              'X-Offline-Queue-Id': item.id
            }
          });

          await syncQueue.removeItem(item.id);
          await updateCount();
        } catch (error) {
          console.error(`Erreur de synchronisation pour l'element ${item.id}:`, error);
          const status = error.response?.status;

          // Authentication/authorization failures must not silently discard business data.
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

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    const owner = generateId();
    lockOwnerRef.current = owner;

    if (navigator.locks?.request) {
      let acquired = false;
      await navigator.locks.request(
        'gestock-offline-sync',
        { ifAvailable: true },
        async (lock) => {
          if (!lock) return;
          acquired = true;
          await processQueueUnlocked();
        }
      );
      if (!acquired) return;
      return;
    }

    if (!acquireFallbackLock(owner)) return;
    try {
      await processQueueUnlocked();
    } finally {
      releaseFallbackLock(owner);
      lockOwnerRef.current = null;
    }
  }, [processQueueUnlocked]);

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
    const normalizedMethod = String(method || '').toLowerCase();
    if (!MUTATION_METHODS.has(normalizedMethod)) {
      throw new Error('Seules les mutations HTTP POST/PUT/PATCH/DELETE peuvent être mises en file hors ligne.');
    }

    const identity = getQueueIdentity();
    if (!identity) {
      throw new Error('Impossible de mettre une action hors ligne en file sans contexte utilisateur/tenant.');
    }

    let serializedSize;
    try {
      serializedSize = new Blob([JSON.stringify(data ?? null)]).size;
    } catch {
      throw new Error('La charge hors ligne doit être sérialisable en JSON.');
    }
    if (serializedSize > MAX_ITEM_BYTES) {
      throw new Error('La charge hors ligne est trop volumineuse. Réduisez les données avant de réessayer.');
    }

    const keys = await syncQueue.keys();
    let identityCount = 0;
    for (const key of keys) {
      const item = await syncQueue.getItem(key);
      if (item && sameIdentity(item.identity, identity)) identityCount += 1;
    }
    if (identityCount >= MAX_QUEUE_SIZE) {
      throw new Error('La file hors ligne a atteint sa limite. Réduisez les actions en attente avant de continuer.');
    }

    const id = generateId();
    const action = {
      id,
      method: normalizedMethod,
      url,
      data,
      timestamp: new Date().toISOString(),
      identity,
      status: 'pending'
    };

    await syncQueue.setItem(id, action);
    await updateCount();

    window.dispatchEvent(new CustomEvent('gestock:offline-queued', {
      detail: { id, method: normalizedMethod, url, timestamp: action.timestamp }
    }));

    if (navigator.onLine) await processQueue();
    return { id, queued: true };
  }, [processQueue, updateCount]);

  useEffect(() => {
    const handleOnline = () => {
      void processQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  useEffect(() => () => {
    const owner = lockOwnerRef.current;
    if (owner) releaseFallbackLock(owner);
  }, []);

  return { addToQueue, pendingCount, failedCount, isSyncing, processQueue, retryFailed };
}
