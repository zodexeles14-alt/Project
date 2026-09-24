const CACHE_NAME = 'saferesponse-v1';
const ASSETS_TO_CACHE = [
  './',
  './RRR.html',
  './RRR.css',
  './RRR.js',
  './manifest.json'
];

// Install Event - Cache Files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event - Serve Cached Files Offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
