import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const ALERTES_CACHE = 'gestock-alertes-valides-v1';
const STATUTS_NON_CACHEABLES = [403, 429];

function isAlertesRequest({ url, request }) {
  return (
    request.method === 'GET' &&
    (url.pathname.endsWith('/stocks/alertes') || url.pathname.endsWith('/dlc/alertes'))
  );
}

async function lireDerniereReponseValide(request) {
  const cache = await caches.open(ALERTES_CACHE);
  return cache.match(request);
}

// Plugin Workbox : seules les reponses 200 sont stockees.
// En cas de 403/429, on force un echec controle pour utiliser le cache existant.
const cacheAlertesValidesPlugin = {
  cacheWillUpdate: async ({ response }) => {
    if (response && response.status === 200) return response;
    return null;
  },
  fetchDidSucceed: async ({ response }) => {
    if (STATUTS_NON_CACHEABLES.includes(response.status)) {
      throw new Error(`Reponse API non cacheable: ${response.status}`);
    }
    return response;
  },
  handlerDidError: async ({ request }) => {
    const cached = await lireDerniereReponseValide(request);
    if (cached) return cached;

    return Response.json(
      {
        offline: true,
        message: 'Aucune donnee valide en cache pour ces alertes.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  },
};

registerRoute(
  isAlertesRequest,
  new NetworkFirst({
    cacheName: ALERTES_CACHE,
    networkTimeoutSeconds: 8,
    plugins: [
      cacheAlertesValidesPlugin,
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 7,
        purgeOnQuotaError: true,
      }),
    ],
  })
);
