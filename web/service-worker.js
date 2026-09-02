const CACHE_NAAM = 'franse-flitsen-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAAM).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE_NAAM).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const netwerkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const kopie = response.clone();
            caches.open(CACHE_NAAM).then((cache) => cache.put(event.request, kopie));
          }
          return response;
        })
        .catch(() => cached);
      return cached || netwerkFetch;
    })
  );
});
