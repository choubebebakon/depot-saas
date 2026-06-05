import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';

// Enregistrement PWA en auto-update : les nouveaux builds sont pris en compte
// des que le service worker detecte une version disponible.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    registration?.update();
  },
  onNeedRefresh() {
    window.location.reload();
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
