import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initAnalytics, initPerformance } from './lib/firebase'
import './styles/globals.css'

// Initialize Firebase Analytics and Performance (production only)
initAnalytics()
initPerformance()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
