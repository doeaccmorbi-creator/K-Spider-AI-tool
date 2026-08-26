/* =========================================================================
   Dr. Shreyansh Academy — Service Worker
   -------------------------------------------------------------------------
   Caches the app shell (HTML/JS/logo/icons) so the app opens instantly and
   works offline for reading. Firebase/Firestore/EmailJS/AI calls always go
   live — this never caches or blocks those, since test results, doubts and
   AI answers need a real connection.
   Bump CACHE_NAME whenever you ship new files so old caches get cleared.
   ========================================================================= */
const CACHE_NAME = 'dsa-shell-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './firebase-config.js',
  './emailjs-config.js',
  './DSA_LOGO.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Never intercept Firebase / Firestore / EmailJS / AI proxy calls — always live.
  if (
    req.url.includes('googleapis.com') ||
    req.url.includes('firebaseapp.com') ||
    req.url.includes('emailjs') ||
    req.url.includes('ks-api-proxy') ||
    req.url.includes('gstatic.com/firebasejs')
  ) return;

  if (req.mode === 'navigate' || req.url.endsWith('.js') || req.url.endsWith('.json')) {
    // Network-first for the page itself AND app.js/config files, so a
    // logged-in user always gets the latest code+content when online —
    // this is what makes future updates show up without a manual cache
    // bump. Falls back to the cached copy only when fully offline.
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for genuinely static assets (images, icons, fonts) — these
  // rarely change, so serving from cache first keeps repeat loads instant.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
