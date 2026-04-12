import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// --- ESTO ACTIVA EL MODO OFFLINE REAL ---
import { registerSW } from 'virtual:pwa-register'

// Registra el service worker automáticamente
// 'immediate: true' hace que la app se descargue en el celular apenas se abre
registerSW({ 
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible, actualizando...');
  },
  onOfflineReady() {
    console.log('App lista para trabajar sin internet.');
  },
})
// ----------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)