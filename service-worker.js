const CACHE_NAME = 'vbb-status-v33';

// App-Shell: nur Dateien, die wirklich existieren!
// (Der alte SW listete eine nicht existierende Font-Datei – dadurch
//  schlug cache.addAll() komplett fehl und der SW wurde NIE installiert.)
const urlsToCache = [
  '/',
  '/index.html',
  '/js/api.js',
  '/js/app.js',
  '/js/livemap.js',
  '/js/changelog.js',
  '/js/extras.js',
  '/styles.css',
  '/manifest.json',
  '/images/favicon.png'
];

// Installation: Dateien einzeln cachen, damit EIN Fehler nicht alles blockiert
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => console.warn('SW: Konnte nicht cachen:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// Aktivierung: alte Caches aufräumen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch-Strategie:
// - API-Requests (cross-origin, z.B. v6.vbb.transport.rest, Karten-Tiles):
//   NIE vom SW cachen -> direkt durchreichen. Das Rate-Limit- und
//   Caching-Management macht die App selbst (apiFetch in js/api.js).
// - App-Shell (HTML/JS/CSS): Network-first mit Cache-Fallback.
//   So bekommen Nutzer nach einem Deploy sofort die neue Version,
//   und offline funktioniert die App trotzdem weiter.
self.addEventListener('fetch', event => {
  const request = event.request;

  // Nur GET-Requests behandeln
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-Origin (API, Leaflet-CDN, Tiles): nicht anfassen
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Gültige Antwort -> Cache aktualisieren und zurückgeben
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() =>
        // Offline -> aus dem Cache bedienen
        caches.match(request).then(cached => {
          if (cached) return cached;
          // Navigations-Fallback auf index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
      )
  );
});
