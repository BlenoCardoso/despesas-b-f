import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configureStatusBar, startStatusBarThemeSync } from './native/statusBar'

// Mark app bootstrap early so tests can detect if the module ran at all.
// @ts-ignore
window.__app_bootstrapped = true

console.log('main.tsx executed, app mounted')

// Configure native status bar on mobile before rendering React
try { 
  configureStatusBar()
  startStatusBarThemeSync()
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
