const CACHE_NAME = 'travel-log-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Claim control of all open tabs instantly
});

self.addEventListener('fetch', (event) => {
  // RULE 1: Ignore Firebase database calls. Firebase has its own offline engine.
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit')) {
    return;
  }

  // RULE 2: Network-First Strategy. Try the internet, if it fails, use the cache.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          // Save a copy of the new file for next time
          if (networkResponse.status === 200 && event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
        });
        return networkResponse.clone();
      }).catch(() => {
        // If the internet is dead, and it's a page load, show the cached app
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
      return cachedResponse || fetchPromise;
    })
  );
});
