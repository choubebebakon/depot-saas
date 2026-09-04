import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// App shell : une navigation vers une route React reste ouvrable hors connexion
// dès que le build courant a été précaché.
const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//, /^\/notifications\/socket/],
  }),
);

// Les alertes sont des données authentifiées et potentiellement propres à un
// utilisateur/tenant. Elles ne doivent pas être placées dans un cache partagé
// par URL, car un autre compte pourrait récupérer une ancienne réponse.
// Le mode NetworkOnly conserve donc l'isolation des données. Le shell PWA,
// lui, reste disponible hors connexion via le precache ci-dessus.
function isAlertesRequest({ url, request }) {
  return (
    request.method === 'GET' &&
    (url.pathname.endsWith('/stocks/alertes') || url.pathname.endsWith('/dlc/alertes'))
  );
}

registerRoute(isAlertesRequest, new NetworkOnly());
