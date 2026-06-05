import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuration Vite 8 + vite-plugin-pwa pour Gestock SaaS.
// Le service worker est ecrit dans src/sw.js afin de gerer finement
// les erreurs API 403/429 et le repli sur les dernieres donnees valides.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/gestock-neon-192.png', 'icons/gestock-neon-512.png'],
      manifest: {
        name: 'Gestock SaaS',
        short_name: 'Gestock',
        description: 'Gestion SaaS de depots de boissons avec consultation offline des stocks et alertes.',
        theme_color: '#1e1e2d',
        background_color: '#1e1e2d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          {
            src: '/icons/gestock-neon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/gestock-neon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/gestock-neon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        rollupFormat: 'iife',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest,woff2}'],
        globIgnores: ['**/node_modules/**/*'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('@tanstack')) return 'tanstack';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('axios') || id.includes('socket.io-client') || id.includes('localforage')) return 'runtime-utils';
          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'react-vendor';

          return 'vendor';
        },
      },
    },
  },
});
