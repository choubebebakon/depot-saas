import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import api from '../api/axios';

// Initialisation du stockage de la file d'attente
const syncQueue = localforage.createInstance({
  name: 'GesTock',
  storeName: 'syncQueue'
});

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mettre Ã  jour le compteur d'éléments en attente
  const updateCount = useCallback(async () => {
    const keys = await syncQueue.keys();
    setPendingCount(keys.length);
  }, []);

  useEffect(() => {
    updateCount();
  }, [updateCount]);

  /**
   * Ajoute une action Ã  la file d'attente de synchronisation
   */
  const addToQueue = async (method, url, data) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const action = {
      id,
      method,
      url,
      data,
      timestamp: new Date().toISOString()
    };
    await syncQueue.setItem(id, action);
    await updateCount();
    
    // Si on est en ligne, on tente de synchroniser immédiatement
    if (navigator.onLine) {
      processQueue();
    }
  };

  /**
   * Traite la file d'attente
   */
  const processQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    const keys = await syncQueue.keys();
    if (keys.length === 0) return;

    setIsSyncing(true);
    window.dispatchEvent(new CustomEvent('sync-start'));

    // Trier les clés par timestamp pour traiter dans l'ordre (FIFO)
    const items = [];
    for (const key of keys) {
      items.push(await syncQueue.getItem(key));
    }
    items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const item of items) {
      try {
        // Ajout du timestamp original dans les données pour le backend
        const payload = { ...item.data, createdAt: item.timestamp };
        
        await api({
          method: item.method,
          url: item.url,
          data: payload
        });

        // Succès -> retirer de la file
        await syncQueue.removeItem(item.id);
        await updateCount();
      } catch (error) {
        console.error(`Erreur de synchronisation pour l'élément ${item.id}:`, error);
        // On s'arrête si c'est une erreur réseau (on réessaiera plus tard)
        // S'il s'agit d'une erreur 4xx (validation), on devrait peut-être le retirer quand même ou le marquer en erreur
        if (error.response?.status >= 400 && error.response?.status < 500) {
           // On retire quand même pour ne pas bloquer la file (erreur permanente)
           await syncQueue.removeItem(item.id);
           await updateCount();
        } else {
          break; // Probablement une erreur serveur ou réseau, on arrête le traitement global
        }
      }
    }

    setIsSyncing(false);
    window.dispatchEvent(new CustomEvent('sync-end'));
  }, [isSyncing, updateCount]);

  // Surveiller le retour de la connexion
  useEffect(() => {
    const handleOnline = () => processQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  return { addToQueue, pendingCount, isSyncing, processQueue };
}




