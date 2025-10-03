import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mark app bootstrap early so tests can detect if the module ran at all.
// @ts-ignore
window.__app_bootstrapped = true

console.log('main.tsx executed, app mounted')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
