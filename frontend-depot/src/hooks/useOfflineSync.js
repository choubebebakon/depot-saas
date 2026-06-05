import { useState, useEffect, useCallback, useRef } from 'react';
import localforage from 'localforage';
import api from '../api/axios';
import { generateId } from '../utils/offline';

const syncQueue = localforage.createInstance({
  name: 'GesTock',
  storeName: 'syncQueue'
});

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
      if (!cancelled) {
        setPendingCount(keys.length);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

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
          if (error.response?.status >= 400 && error.response?.status < 500) {
            await syncQueue.removeItem(item.id);
            await updateCount();
          } else {
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
    const id = generateId();
    const action = {
      id,
      method,
      url,
      data,
      timestamp: new Date().toISOString()
    };

    await syncQueue.setItem(id, action);
    await updateCount();

    if (navigator.onLine) {
      await processQueue();
    }
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
