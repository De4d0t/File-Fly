import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FileFlyProvider } from './context/FileFlyContext.jsx';
import './index.css';

if (typeof window !== 'undefined' && window.fileflyOfflineTimer) {
  clearTimeout(window.fileflyOfflineTimer);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FileFlyProvider>
      <App />
    </FileFlyProvider>
  </React.StrictMode>
);

// Register PWA Service Worker (only for mobile/browser PWAs, not inside Electron)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.fileflyDesktop) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[FileFly PWA] Service worker registered successfully, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[FileFly PWA] Service worker registration failed:', err);
      });
  });
}
