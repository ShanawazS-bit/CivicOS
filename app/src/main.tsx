import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setWorkerUrl } from 'maplibre-gl'
import MaplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker?url'
import './index.css'
import App from './App.tsx'

// Fix for MapLibre GL v5 + Vite production builds:
// Without explicitly setting the worker URL, the map renders blank on Vercel/Netlify
setWorkerUrl(MaplibreWorkerUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
