/**
 * StudyLib PWA Service Worker.
 * Enables offline caching and app installation capability with automatic cache-busting.
 */

const CACHE_NAME = 'studylib-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
  '/favicon.svg'
];

// Install event — cache core assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event — clean up all old caches immediately & claim active clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Clearing stale cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event — Network-First for HTML/Navigation, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls from intercepting
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || 
                       event.request.headers.get('accept')?.includes('text/html') ||
                       event.request.url.endsWith('/') ||
                       event.request.url.includes('/index.html');

  if (isNavigation) {
    // Strategy: Network-First for HTML/Navigation to ensure latest index.html & JS bundle hashes
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Strategy for static assets (JS, CSS, Images): Cache First with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
