import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DialogProvider } from './components/DialogProvider'

// --- ESTO ACTIVA EL MODO OFFLINE REAL ---
import { registerSW } from 'virtual:pwa-register'

// Registra el service worker automáticamente
// 'immediate: true' hace que la app se descargue en el celular apenas se abre
registerSW({ 
  immediate: true,
  onNeedRefresh() {
  },
  onOfflineReady() {
  },
})
// ----------------------------------------

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
)