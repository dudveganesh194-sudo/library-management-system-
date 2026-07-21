import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Attempt to lock screen orientation to portrait on mobile devices
if (window.screen && window.screen.orientation && typeof (window.screen.orientation as any).lock === 'function') {
  try {
    (window.screen.orientation as any).lock('portrait-primary').catch(() => {});
  } catch {}
}

// Automatically handle Vite chunk preload failures (occurs when a new deployment invalidates old asset hashes)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New app version detected. Auto-reloading to fetch fresh assets...');
  event.preventDefault();
  window.location.reload();
});

// Auto-recovery for unhandled chunk/script loading failures
window.addEventListener('error', (event) => {
  const message = event.message || '';
  const isChunkError =
    message.includes('Loading chunk') ||
    message.includes('Importing a module script failed') ||
    message.includes('Unexpected token');

  if (isChunkError) {
    console.warn('Chunk load failure detected. Clearing stale ServiceWorker and auto-reloading...');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
