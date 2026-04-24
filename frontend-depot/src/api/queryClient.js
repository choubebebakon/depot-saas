import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import localforage from 'localforage';

// Configuration de localforage pour utiliser IndexedDB
localforage.config({
  name: 'GesTock',
  storeName: 'queryCache'
});

// Création d'un adapteur pour utiliser localforage avec le persister de TanStack
const storage = {
  getItem: (key) => localforage.getItem(key),
  setItem: (key, value) => localforage.setItem(key, value),
  removeItem: (key) => localforage.removeItem(key),
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 heures
      staleTime: 1000 * 60 * 5, // 5 minutes
      networkMode: 'offlineFirst',
      retry: 0, // On gère les retries via la file d'attente système
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});

const persister = createSyncStoragePersister({
  storage,
  key: 'GESTOCK_QUERY_CACHE',
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // Garder le cache 24h
});




