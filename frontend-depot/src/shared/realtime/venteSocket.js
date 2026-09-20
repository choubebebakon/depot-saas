import { io } from 'socket.io-client';

/**
 * Socket singleton partagée pour le namespace racine (VenteGateway backend :
 * événements `nouvelle_vente` / `vente_prise_en_charge`, rooms `join_alerts`).
 *
 * Plusieurs pages/hooks s'y abonnent (POS Caisse, alertes magasinier) : une
 * seule connexion est donc créée et partagée via un comptage de références.
 * Au démontage (y compris le double-montage de React StrictMode en dev) on ne
 * déconnecte PAS la socket — on retire seulement ses écouteurs — sinon la
 * poignée de main WebSocket est interrompue ("WebSocket is closed before the
 * connection is established") et la reconnexion tourne en boucle.
 */

// Singleton résistant au HMR Vite : la réévaluation du module (hot reload)
// ne doit pas réinitialiser la socket, sinon l'ancienne instance reste
// connectée en orpheline et une doublon est créé (POST 400 sid inconnu).
function getRegistry() {
  const win = typeof window !== 'undefined' ? window : globalThis;
  if (!win.__depotVenteSocket) {
    win.__depotVenteSocket = { socket: null, refCount: 0 };
  }
  return win.__depotVenteSocket;
}

function resolveVenteUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
}

export function acquireVenteSocket() {
  const reg = getRegistry();
  if (!reg.socket) {
    reg.socket = io(resolveVenteUrl(), {
      // forceNew : namespace racine isolé du Manager de /realtime et
      // /notifications, afin qu'aucune déconnexion d'un autre namespace ne
      // ferme la session partagée (sid inconnu → 400 sur /socket.io).
      forceNew: true,
      // Ordre [polling, websocket] obligatoire : le passage direct websocket
      // échoue sous réseau instable ou double-rendu React (cf. realtimeClient).
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
  }
  reg.refCount += 1;
  return reg.socket;
}

/** Décrémente le compteur — ne déconnecte jamais la socket partagée. */
export function releaseVenteSocket() {
  const reg = getRegistry();
  reg.refCount = Math.max(0, reg.refCount - 1);
}

/** Déconnexion totale (logout / perte d'identité) : à n'appeler que là. */
export function destroyVenteSocket() {
  const reg = getRegistry();
  reg.refCount = 0;
  if (reg.socket) {
    reg.socket.removeAllListeners();
    reg.socket.disconnect();
    reg.socket = null;
  }
}

export function getVenteSocket() {
  return getRegistry().socket;
}
