import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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