import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Cornerstone dicom-image-loader crea su worker con { type: 'module' };
  // el formato iife por defecto de Vite rompe el build ("Invalid value iife for worker.format").
  worker: { format: 'es' },
  // --- Fix dev: TypeError "Class extends value undefined" en xmlbuilder2 ---
  // xmlbuilder2 (dep de dicom-image-loader) hace `class XMLBuilderCBImpl extends events_1.EventEmitter`.
  // En dev, Vite externaliza el builtin 'events' y rompe el interop CJS (EventEmitter queda undefined).
  // Se pre-bundla con el polyfill npm de events y se define `global` para el bundle de deps.
  define: { global: 'globalThis' },
  resolve: {
    // resuelve al polyfill npm, no al builtin de Node
    alias: { events: fileURLToPath(new URL('./node_modules/events', import.meta.url)) },
  },
  optimizeDeps: {
    include: [
      '@cornerstonejs/core',
      '@cornerstonejs/dicom-image-loader',
      'dicom-parser',
      'xmlbuilder2',
      'events',
    ],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Esto le dice a Vite qué archivos extra (logos, etc) debe incluir en la cache
      includeAssets: ['logo192.png', 'logo512.png', 'favicon.ico', 'dental-icon.svg'],
      workbox: {
        // Esta es la lista de archivos que se guardarán para el modo offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        // Esto evita que la app falle si un archivo es muy grande
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, 
      },
      manifest: {
        name: 'ShiningCloud | Dental',
        short_name: 'ShiningCloud',
        description: 'Plataforma Clínica de Alto Rendimiento',
        theme_color: '#FDFBF7',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // Esto ayuda a que el icono se vea bien en Android
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})