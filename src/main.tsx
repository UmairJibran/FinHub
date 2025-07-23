import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initializeSecurity } from './lib/security-config'

// Initialize security measures
initializeSecurity();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)