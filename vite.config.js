import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola cuando subes cambios a Vercel
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'] // Guarda estos archivos para el modo offline
      },
      manifest: {
        name: 'ShiningCloud | Dental',
        short_name: 'ShiningCloud',
        description: 'Plataforma Clínica de Alto Rendimiento',
        theme_color: '#FDFBF7', // El color boutique de tu fondo
        background_color: '#FDFBF7',
        display: 'standalone', // Hace que parezca una app nativa sin la barra de Chrome
        icons: [
          {
            src: 'logo192.png', // Asegúrate de tener una imagen 192x192 en la carpeta 'public'
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png', // Asegúrate de tener una imagen 512x512 en la carpeta 'public'
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})