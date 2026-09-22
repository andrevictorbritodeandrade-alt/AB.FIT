
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
// Fix: Import process explicitly from node:process to ensure proper typing in Node environment
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Fix: Use process.cwd() from the imported node process to safely load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'ABFIT: Oficial',
          short_name: 'ABFIT',
          description: 'Assessoria em Treinamentos Físicos ABFIT',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        manifestFilename: 'manifest.json',
        devOptions: {
          enabled: false
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 4000000 // 4MB
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || env.REACT_APP_GEMINI_API_KEY || ""),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    optimizeDeps: {
      include: ['@google/genai']
    }
  };
});
