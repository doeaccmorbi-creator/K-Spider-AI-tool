// ── KSpider Connect Service Worker ──
const CACHE_NAME = 'kspider-v1';

const PRECACHE_ASSETS = [
  '/',
  '/KSpider_Job_Placement.html',
];

// ── INSTALL: Pre-cache shell assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Install failed, skipping pre-cache:', err);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: Clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: Network-first for API/Firebase; Cache-first for static ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET, Firebase, Analytics, AdSense – always go to network
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('googlesyndication.com') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('razorpay.com') ||
    url.hostname.includes('puter.com')
  ) {
    return; // Let browser handle these normally
  }

  // Cache-first for fonts & static resources
  if (
    url.hostname.includes('fonts.g') ||
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return resp;
        });
      })
    );
    return;
  }

  // Network-first for HTML navigation
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
