// Minimal service worker - just needs to exist for PWA installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Optional: just pass through all requests without caching
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});