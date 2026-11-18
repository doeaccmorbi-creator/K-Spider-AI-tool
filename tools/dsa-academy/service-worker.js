/* =========================================================================
   Dr. Shreyansh Academy — Service Worker (v15)
   -------------------------------------------------------------------------
   * Caches the app shell (HTML/JS/logo/icons) so the app opens with NO internet.
   * Also caches the Firebase SDK scripts, EmailJS and Google Fonts the first
     time they load, so the page can start offline (login itself still needs
     internet — offline MCQ practice works without login, see offline.js).
   * Firestore / Auth / AI calls are never cached — always live.
   * 'dsa-offline-img' = question figures saved by Offline Packs (kept on update).
   Bump CACHE_NAME whenever you ship new files so old caches get cleared.
   ========================================================================= */
const CACHE_NAME = 'dsa-shell-v15';
const KEEP = [CACHE_NAME, 'dsa-offline-img'];
const CORE_ASSETS = [
  './', './index.html', './app.js', './mcq.js', './extras.js', './campus.js', './classwork.js',
  './lectures.js', './learn.js', './gen.js', './rewards.js', './tutor.js', './batches.js', './i18n.js',
  './premium.js', './qbank.js', './homework.js', './quiz.js',
  './errlog.js', './a11y.js', './offline.js', './ptmsg.js', './backup.js',
  './firebase-config.js', './emailjs-config.js', './DSA_LOGO.png', './manifest.json', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', event => {
  // add one by one: a single missing file must not break the whole install
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(CORE_ASSETS.map(u => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => KEEP.indexOf(k) < 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isLiveApi(u) {
  return u.includes('firestore.googleapis.com') || u.includes('identitytoolkit') || u.includes('securetoken')
    || u.includes('firebaseapp.com') || u.includes('firebaseio.com') || u.includes('emailjs.com')
    || u.includes('ks-api-proxy') || u.includes('apis.google.com') || u.includes('google.com/recaptcha')
    || (u.includes('googleapis.com') && !u.includes('fonts.googleapis.com'));
}
function isLibrary(u) {
  return u.includes('gstatic.com/firebasejs') || u.includes('cdn.jsdelivr.net') ||
    u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (isLiveApi(url)) return;

  // Versioned third-party libraries & fonts: cache-first, filled on first online use.
  if (isLibrary(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => cache.match(req).then(hit => {
        const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }))
    );
    return;
  }

  const path = new URL(url).pathname;
  if (req.mode === 'navigate' || path.endsWith('.js') || path.endsWith('.json')) {
    // Network-first so a connected user always gets the newest code; falls back
    // to the cached copy (ignoring ?v= query) when offline.
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(c => c || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
    );
    return;
  }

  // Static assets (images, icons, offline question figures): cache-first.
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
